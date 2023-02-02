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
  CreateRefundInput,
} from '@/server/repository/payment.repo';
import { TRPCError } from '@trpc/server';
import { constants } from '../constants';
import { BookingService } from '@/svc/booking.service';
import { ProductService } from '@/svc/product.service';
import { sendBookingSuccessEmail, sendRefundEmail } from '@/server/repository/mailersend.repo';

const bookingDataSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  startSession: z.string(),
  endSession: z.string(),
  guests: z.number(),
  roomId: z.string(),
  roomVersion: z.number(),
  productId: z.string(),
  productVersion: z.number(),
  receipt: z.object({
    productPrice: z.number(),
    roomPrice: z.number(),
    additionalHeadsPrice: z.number(),
    total: z.number(),
  }),
});

type FormSchemaType = z.infer<typeof bookingDataSchema>;

class Service {
  public async initiatePaymentSessionForBooking(
    data: Omit<IBooking, 'id' | 'createdAt' | 'refundId' | 'paymentIntentId' | 'paymentId' | 'ref_no'>,
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

  public async createRefund(data: CreateRefundInput) {
    try {
      return createRefund(data);
    } catch (err) {
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
      ...bookingData,
      paymentIntentId: paymentIntentRecord.id,
      paymentId: paymentIntentRecord.attributes.payments[0].id || '',
      startSession: new Date(bookingData.startSession),
      endSession: new Date(bookingData.endSession),
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
      console.log('No Payment Intent Id!');
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

      if (!!bookingRecord.refundId) {
        console.log('Booking record already refunded');
        return;
      }

      await BookingService.updateBooking(bookingRecord.id, { refundId });

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
