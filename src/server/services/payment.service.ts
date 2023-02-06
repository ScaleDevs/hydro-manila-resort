import { z } from 'zod';
import dayjs from 'dayjs';

import { IBooking } from '@/utils/types';
import {
  createPaymentIntent,
  attachPaymentMethodToIntent,
  AttachPaymentMethodToIntentAttr,
  getPaymentIntentSession,
  getRefundDetails,
  createRefund,
} from '@/server/repository/payment.repo';
import { TRPCError } from '@trpc/server';
import { constants } from '../constants';
import { BookingService } from '@/svc/booking.service';
import { ProductService } from '@/svc/product.service';
import { sendBookingSuccessEmail, sendRefundEmail } from '@/server/repository/mailersend.repo';
import { BookingRefundRepository } from '@/server/repository/bookingrefund.repo';

const bookingDataSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  startSession: z.string(),
  endSession: z.string(),
  guests: z.number(),
  roomId: z.string().nullable(),
  roomVersion: z.number(),
  productId: z.string(),
  productVersion: z.number(),
  receipt: z.object({
    productPrice: z.number(),
    roomPrice: z.number(),
    additionalHeadsPrice: z.number(),
    bookingFee: z.number(),
    total: z.number(),
  }),
});

type FormSchemaType = z.infer<typeof bookingDataSchema>;

class Service {
  public async initiatePaymentSessionForBooking(
    data: Omit<IBooking, 'id' | 'createdAt' | 'paymentIntentId' | 'paymentId' | 'ref_no'>,
  ) {
    try {
      return createPaymentIntent({
        // in cents formula peso * 100
        amount: data.receipt.total * 100,
        currency: 'PHP',
        capture_type: 'automatic',
        statement_descriptor: constants.general.companyName,
        payment_method_allowed: ['gcash', 'card'],
        payment_method_options: {
          card: {
            request_three_d_secure: 'any',
          },
        },
        metadata: {
          bookingRecord: JSON.stringify(data),
        },
      });
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async attachPaymentMethodToIntent(data: AttachPaymentMethodToIntentAttr) {
    try {
      return attachPaymentMethodToIntent(data);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async getPaymentIntentSession(paymentIntentId: string) {
    try {
      return getPaymentIntentSession(paymentIntentId);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async createRefund(
    ref_no: string,
    reason: string,
  ): Promise<{ status: 'MANUAL_PROCESSING' | 'AUTOMATIC_PROCESSING' | 'FAILED' }> {
    try {
      const bookingRecord = await BookingService.findBookingByReferenceNo(ref_no);
      if (!bookingRecord) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking record does not exist' });

      const { total } = bookingRecord.receipt;

      const result = await createRefund({
        amount: total * 100,
        payment_id: bookingRecord.paymentId,
        reason: 'requested_by_customer',
        metadata: {
          reason,
        },
      });

      if ('error' in result) {
        if (result.error === 'available_balance_insufficient') {
          await BookingRefundRepository.createBookingRefund({
            paymongoRefundId: null,
            type: 'MANUAL',
            reason: reason,
            status: 'PROCESSING',
            bookingId: bookingRecord.id,
          });

          console.log('SEND EMAIL REGARDING MANUAL PROCESSING OF REFUND');
          // both customer and hydro manila will receive email for awareness

          return {
            status: 'MANUAL_PROCESSING',
          };
        }

        if (result.error === 'something_went_wrong')
          return {
            status: 'FAILED',
          };
      }

      return {
        status: 'AUTOMATIC_PROCESSING',
      };
    } catch (err) {
      console.log(err);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async handlePaymentPaidEvent(paymentIntentId: string) {
    if (!paymentIntentId) {
      console.log('No Payment Intent Id!');
      return;
    }

    const paymentIntentRecord = await getPaymentIntentSession(paymentIntentId);

    if (
      !paymentIntentRecord ||
      paymentIntentRecord.attributes.status !== 'succeeded' ||
      paymentIntentRecord.attributes.payments.length === 0 ||
      !paymentIntentRecord.attributes.metadata
    ) {
      console.log('Invalid Payment Intent!');
      return;
    }

    const bookingData: FormSchemaType = JSON.parse(paymentIntentRecord.attributes.metadata.bookingRecord);
    const parsed = bookingDataSchema.safeParse(bookingData);

    if (!parsed.success) {
      console.log('Invalid Booking Data!');
      return;
    }

    const bookingRecordCheck = await BookingService.findBookingByPaymentIntentId(paymentIntentRecord.id);

    if (bookingRecordCheck) {
      console.log('Booking Record already exist in DB!');
      return;
    }

    const bookingRecord = await BookingService.createBooking({
      ...parsed.data,
      paymentIntentId: paymentIntentRecord.id,
      paymentId: paymentIntentRecord.attributes.payments[0].id || '',
      startSession: new Date(parsed.data.startSession),
      endSession: new Date(parsed.data.endSession),
    });

    if (!bookingRecord) {
      console.log('send email to hydro regarding booking not stored on db but successful in payment');
    }

    console.log('SUCCESSFULLY ADDED BOOKING');

    const product = await ProductService.findProductById(bookingRecord.productId);

    await sendBookingSuccessEmail({
      recipientEmail: bookingRecord.email,
      customer_name: bookingRecord.name,
      product_type: product?.name || '',
      booking_date: `${dayjs(bookingRecord.startSession).format('MMM DD, YYYY hh:mm:ss A')} - ${dayjs(
        bookingRecord.endSession,
      ).format('MMM DD, YYYY hh:mm:ss A')}`,
      ref_no: bookingRecord.ref_no,
    });

    console.log('EMAIL SUCCESSFULLY SENT');
  }

  public async handleRefundPaymentEvent(paymentIntentId: string, refundId: string) {
    if (!paymentIntentId) {
      console.log('No Payment Intent Id!');
      return;
    }

    if (!refundId) {
      console.log('No Refund Id!');
      return;
    }

    const refundResource = await getRefundDetails(refundId);

    if (!refundResource) {
      console.log('Refund Resource does not exist');
      return;
    }

    if (refundResource.attributes.status === 'succeeded') {
      const bookingRecord = await BookingService.findBookingByPaymentIntentId(paymentIntentId);

      if (!bookingRecord) {
        console.log('Booking record does not exist');
        return;
      }

      const bookingRefundRecord = await BookingRefundRepository.findBookingRefundByBookingId(bookingRecord.id);

      if (!!bookingRefundRecord && bookingRefundRecord.status === 'PROCESSING' && bookingRefundRecord.type === 'MANUAL') {
        await BookingRefundRepository.updateBookinRefund(bookingRefundRecord.bookingRefundId, {
          paymongoRefundId: refundId,
          status: 'SUCCESS',
        });
        await sendRefundEmail({
          recipientEmail: bookingRecord.email,
          customer_name: bookingRecord.name,
          ref_no: bookingRecord.ref_no,
        });

        console.log('EMAIL SUCCESSFULLY SENT');
        return;
      } else if (!!bookingRefundRecord && bookingRefundRecord.status === 'SUCCESS') {
        console.log('Booking record already refunded');
        return;
      }

      await BookingRefundRepository.createBookingRefund({
        paymongoRefundId: refundId,
        type: 'AUTOMATIC',
        reason: refundResource.attributes.metadata.reason || '',
        status: 'SUCCESS',
        bookingId: bookingRecord.id,
      });

      await sendRefundEmail({
        recipientEmail: bookingRecord.email,
        customer_name: bookingRecord.name,
        ref_no: bookingRecord.ref_no,
      });

      console.log('EMAIL SUCCESSFULLY SENT');
    }
  }
}

export const PaymentService = new Service();
