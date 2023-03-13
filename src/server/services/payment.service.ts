import { z } from 'zod';
import dayjs from 'dayjs';
import { v4 } from 'uuid';

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
import {
  notifyAdminDbInsertionError,
  sendBookingSuccessEmail,
  sendRefundEmailConflictBooking,
  sendRefundEmailProcessing,
  sendRefundEmailSuccess,
} from '@/server/repository/mailersend.repo';
import { BookingRefundRepository } from '@/server/repository/bookingrefund.repo';
import { BookingRepository } from '@/server/repository/booking.repo';
import { BookingSettingRepository } from '@/server/repository/bookingsetting.repo';
import { RoomRepository } from '@/server/repository/room.repo';
import { ScheduledEventRepository } from '../repository/scheduledevent.repo';
import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
import { PHpeso } from '../util';

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
    data: Omit<IBooking, 'id' | 'createdAt' | 'paymentIntentId' | 'paymentId' | 'ref_no' | 'calendarEventId'>,
  ) {
    try {
      const isBookingDateTaken = await BookingRepository.checkIfScheduleTaken({
        startDate: data.startSession,
        endDate: data.endSession,
      });

      const isEventSchedTaken = await ScheduledEventRepository.checkIfScheduleIsTaken({
        startDate: data.startSession,
        endDate: data.endSession,
      });

      if (isBookingDateTaken || isEventSchedTaken) return { isSchedAvailable: false };

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

          // SEND EMAIL REGARDING MANUAL PROCESSING OF REFUND - due to balance issue
          await sendRefundEmailProcessing({
            recipientEmail: bookingRecord.email,
            customer_name: bookingRecord.name,
            ref_no: bookingRecord.ref_no,
            amount: bookingRecord.receipt.total,
          });

          if (bookingRecord.calendarEventId) await GoogleCalendarRepository.deleteEvent(bookingRecord.calendarEventId);

          return {
            status: 'MANUAL_PROCESSING',
          };
        }

        if (result.error === 'something_went_wrong')
          return {
            status: 'FAILED',
          };
      }

      if (bookingRecord.calendarEventId) await GoogleCalendarRepository.deleteEvent(bookingRecord.calendarEventId);

      return {
        status: 'AUTOMATIC_PROCESSING',
      };
    } catch (err) {
      console.log(err);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async handlePaymentPaidEvent(paymentIntentId: string, paymentType: string) {
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

    const isBookingDateTaken = await BookingRepository.checkIfScheduleTaken({
      startDate: parsed.data.startSession,
      endDate: parsed.data.endSession,
    });

    const isEventSchedTaken = await ScheduledEventRepository.checkIfScheduleIsTaken({
      startDate: parsed.data.startSession,
      endDate: parsed.data.endSession,
    });

    if (isBookingDateTaken || isEventSchedTaken) {
      // SEND EMAIL REGARDING MANUAL PROCESSING OF Refund/Reschedule - due to conflict booking at the same time
      await sendRefundEmailConflictBooking({
        recipientEmail: parsed.data.email,
        customer_name: parsed.data.name,
        payment_id: paymentIntentRecord.attributes.payments[0].id,
      });
      return;
    }

    const product = await ProductService.findProductById(parsed.data.productId);
    const bookingSettings = await BookingSettingRepository.findFirstBookingSetting();
    const room = await RoomRepository.findManyRoom({ page: 1, limit: 5 });
    const chosenRoom = room.records.find((v) => v.roomId === parsed.data.roomId);
    const bothRooms = room.records.find((v) => v.roomIdentityName === 'ROOM 1 & 2');
    const room1 = room.records.find((v) => v.roomIdentityName === 'ROOM 1');
    const room2 = room.records.find((v) => v.roomIdentityName === 'ROOM 2');

    const productDetails = product?.details[product.activeVersion - 1];
    const room2Details = room2?.details[room2.activeVersion - 1];
    const room1Details = room1?.details[room1.activeVersion - 1];

    const isRoom2 = () => parsed.data.roomId === room2?.roomId;
    const isRoom1 = () => parsed.data.roomId === room1?.roomId;
    const isBothRooms = () => parsed.data.roomId === bothRooms?.roomId;

    const bookedDate = dayjs.utc(parsed.data.startSession);
    const checkOutDate = dayjs.utc(parsed.data.endSession);

    const calendarEventId = await GoogleCalendarRepository.createEvent({
      summary: parsed.data.name,
      description: `${product?.name} / ${parsed.data.guests ?? 0} PAX / ${
        chosenRoom?.roomIdentityName ?? (!!productDetails?.withRooms ? 'ALL ROOMS' : 'NO ROOM')
      }`,
      start: {
        dateTime: bookedDate.format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
        timeZone: constants.general.timezone,
      },
      end: {
        dateTime: checkOutDate.format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
        timeZone: constants.general.timezone,
      },
    });

    const bookingRecord = await BookingService.createBooking({
      ...parsed.data,
      paymentIntentId: paymentIntentRecord.id,
      paymentId: paymentIntentRecord.attributes.payments[0].id || '',
      startSession: parsed.data.startSession,
      endSession: parsed.data.endSession,
      calendarEventId,
    });

    const ref_no_holder = bookingRecord.ref_no || v4();

    if (!bookingRecord) {
      // notify hydro support if booking record was not added (so they can add manually on their end)
      await notifyAdminDbInsertionError({
        customer_name: parsed.data.name,
        payment_id: paymentIntentRecord.attributes.payments[0].id,
        ref_no: ref_no_holder,
        startSession: dayjs(parsed.data.startSession).format('MMM DD, YYYY hh:mm:ss A'),
        endSession: dayjs(parsed.data.endSession).format('MMM DD, YYYY hh:mm:ss A'),
      });
    }

    console.log('SUCCESSFULLY ADDED BOOKING');

    await sendBookingSuccessEmail({
      recipientEmail: parsed.data.email,
      guest_name: parsed.data.name,
      reference_number: ref_no_holder,
      booking_type: product?.name || '',
      number_of_rooms: !!productDetails?.withRooms ? 2 : 0,
      number_of_guest: parsed.data.guests,
      room_type: !!productDetails?.withRooms ? 'ALL ROOMS' : '-',
      checkin_datetime: bookedDate.tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
      checkout_datetime: checkOutDate.tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
      booking_type_rate: 'BEST AVAILABLE RATE',
      product_price: PHpeso.format(parsed.data.receipt.productPrice),
      extra_person_rate: !!bookingSettings?.extraHeadFee ? `${PHpeso.format(bookingSettings?.extraHeadFee)}` : 'N/A',
      extra_person_qty: parsed.data.guests - (bookingSettings?.minPax || 25),
      extra_person_total: PHpeso.format(parsed.data.receipt.additionalHeadsPrice),
      room2_rate: room2Details ? PHpeso.format(room2Details.price) : 'N/A',
      room2_qty: isRoom2() || isBothRooms() ? 1 : 0,
      room2_total: PHpeso.format(room2Details && (isRoom2() || isBothRooms()) ? room2Details.price : 0),
      room1_rate: room1Details ? PHpeso.format(room1Details.price) : 'N/A',
      room1_qty: isRoom1() || isBothRooms() ? 1 : 0,
      room1_total: PHpeso.format(room1Details && (isRoom1() || isBothRooms()) ? room1Details.price : 0),
      addon_total: PHpeso.format(parsed.data.receipt.additionalHeadsPrice + parsed.data.receipt.roomPrice),
      type_payment: paymentType,
      total_payment: PHpeso.format(parsed.data.receipt.total),
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
        await sendRefundEmailSuccess({
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

      await sendRefundEmailSuccess({
        recipientEmail: bookingRecord.email,
        customer_name: bookingRecord.name,
        ref_no: bookingRecord.ref_no,
      });

      console.log('EMAIL SUCCESSFULLY SENT');
    }
  }
}

export const PaymentService = new Service();
