import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';

import { BookingSettingRepository } from '@/repo/bookingsetting.repo';
import {
  AttachPaymentMethodToIntentAttr,
  attachPaymentMethodToIntent,
  createPaymentIntent,
  createRefund,
  getPaymentIntentSession,
} from '@/repo/payment.repo';
import { ProductRepository } from '@/repo/product.repo';
import { RoomRepository } from '@/repo/room.repo';
import { BookingRepository } from '@/repo/booking.repo';
import { BookingAttemptRepository } from '@/repo/bookingattempt.repo';
import { BookingRefundRepository } from '@/repo/bookingrefund.repo';
import { GoogleCalendarRepository } from '@/repo/googlecalender.repo';
import { sendRefundEmailProcessing } from '@/repo/mailersend.repo';
import { BookingService } from '@/svc/booking.service';
import { tzSchedToDayJsInsance, utcDateToTzDayInstance } from '@/utils/helper';
import { BookingStatusDisplay, CustomerUpdateBookingParams, DateSession } from '@/utils/types';
import { createReferenceNumber } from '@/server/util';
import { constants } from '@/server/constants';

export * as PaymentHandler from './payment.handler';

export const initiatePaymentSessionForBooking = async (input: {
  name: string;
  email: string;
  phoneNumber: string;
  guests: number;
  roomId: string | null;
  productId: string;
  bookingDate: string;
}) => {
  try {
    const product = await ProductRepository.findProductById(input.productId);
    const bookingSetting = await BookingSettingRepository.findFirstBookingSetting();

    let roomDetails;
    if (input.roomId) roomDetails = await RoomRepository.findRoomById(input.roomId);

    const endDate = dayjs(input.bookingDate)
      .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
      .format('YYYY-MM-DD');
    const startSessionDayInstance = tzSchedToDayJsInsance(input.bookingDate, product.scheduleStart);
    const endSessionDayInstance = tzSchedToDayJsInsance(endDate, product.scheduleEnd);

    let total = product.price;
    if (roomDetails) total += roomDetails.price;
    if (input.guests && input.guests > bookingSetting.minPax)
      total += (input.guests - bookingSetting.minPax) * bookingSetting.extraHeadFee;

    const data = {
      name: input.name,
      email: input.email,
      phoneNumber: input.phoneNumber,
      guests: input.guests,
      roomId: input.roomId,
      productId: input.productId,
      startSession: startSessionDayInstance.toISOString(),
      endSession: endSessionDayInstance.toISOString(),
      receipt: {
        productPrice: product.price,
        roomPrice: roomDetails?.price || 0,
        additionalHeadsPrice:
          input.guests && input.guests > bookingSetting.minPax
            ? (input.guests - bookingSetting.minPax) * bookingSetting.extraHeadFee
            : 0,
        bookingFee: 0,
        total,
      },
    };

    const refNo = createReferenceNumber();

    const statusDisplay = {
      ref_no: refNo,
      customerName: input.name,
      guests: input.guests,
      bookedDate: startSessionDayInstance.format('MMM DD, YYYY hh:mm A'),
      checkOutDate: endSessionDayInstance.format('MMM DD, YYYY hh:mm A'),
      scheduleType: product.name,
      roomName: roomDetails?.roomIdentityName,
    } as BookingStatusDisplay;

    const isTaken = await BookingService.checkScheduleAvailability({
      startDate: data.startSession,
      endDate: data.endSession,
    });

    if (isTaken) throw new TRPCError({ code: 'CONFLICT', message: 'Schedule is not available' });

    return {
      paymentIntentResource: await createPaymentIntent({
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
          statusDisplay: JSON.stringify(statusDisplay),
          bookedSchedule: JSON.stringify({
            startSession: data.startSession,
            endSession: data.endSession,
            ref_no: refNo,
          }),
          bookingRecord: JSON.stringify({
            ...data,
            ref_no: refNo,
          }),
        },
      }),
      bookingState: data,
    };
  } catch (err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
};

export const initiatePaymentSessionForUpdateBooking = async (
  bookingRefNo: string,
  bookingUpdates: CustomerUpdateBookingParams,
) => {
  try {
    const bookingRecord = await BookingRepository.findBookingByReferenceNo(bookingRefNo);
    if (!bookingRecord) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking Record Not Found!' });

    const product = await ProductRepository.findProductById(bookingUpdates.productId || bookingRecord.productId);
    const roomId = bookingUpdates.roomId || bookingRecord.roomId;
    const room = roomId ? await RoomRepository.findRoomById(roomId) : undefined;
    const receipt = await BookingService.getBookingDetailsTotal({
      product,
      room,
      guests: bookingUpdates.guests || bookingRecord.guests,
    });
    let bookedSchedule = '';
    const statusDisplay = {
      ref_no: bookingRecord.ref_no,
      customerName: bookingRecord.name,
      guests: bookingUpdates.guests || bookingRecord.guests,
      bookedDate: '',
      checkOutDate: '',
      scheduleType: product.name,
      roomName: room?.roomIdentityName,
    } as BookingStatusDisplay;

    if (bookingUpdates.bookingDate || bookingUpdates.productId) {
      const bookingDate =
        (bookingUpdates.bookingDate as string) || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD');
      const endDate = dayjs(bookingDate)
        .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
        .format('YYYY-MM-DD');

      const startSessionDayInstance = tzSchedToDayJsInsance(bookingDate, product.scheduleStart);
      const endSessionDayInstance = tzSchedToDayJsInsance(endDate, product.scheduleEnd);

      statusDisplay.bookedDate = startSessionDayInstance.format('MMM DD, YYYY hh:mm A');
      statusDisplay.checkOutDate = endSessionDayInstance.format('MMM DD, YYYY hh:mm A');

      const startSession = startSessionDayInstance.toISOString();
      const endSession = endSessionDayInstance.toISOString();

      const isTaken = await BookingService.checkScheduleAvailability({
        startDate: startSession,
        endDate: endSession,
      });

      if (isTaken) throw new TRPCError({ code: 'CONFLICT', message: 'Schedule is not available' });

      bookedSchedule = JSON.stringify({
        startSession,
        endSession,
        ref_no: bookingRecord.ref_no,
      });
    } else {
      statusDisplay.bookedDate = dayjs
        .utc(bookingRecord.startSession)
        .tz(constants.general.timezone)
        .format('MMM DD, YYYY hh:mm A');
      statusDisplay.checkOutDate = dayjs
        .utc(bookingRecord.endSession)
        .tz(constants.general.timezone)
        .format('MMM DD, YYYY hh:mm A');
    }

    return {
      paymentIntentResource: await createPaymentIntent({
        // in cents formula peso * 100
        amount: (receipt.total - bookingRecord.receipt.total) * 100,
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
          statusDisplay: JSON.stringify(statusDisplay),
          bookedSchedule,
          bookingUpdateParams: JSON.stringify({
            currentBookingRecord: bookingRecord,
            bookingRecordId: bookingRecord.id,
            updates: {
              ...bookingUpdates,
            },
          }),
          receipt: JSON.stringify(receipt),
        },
      }),
    };
  } catch (err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
};

export const attachPaymentMethodToIntentHandler = async (data: AttachPaymentMethodToIntentAttr) => {
  try {
    const result = await getPaymentIntentSession(data.paymentIntentId);

    if (!!result.attributes.metadata.bookedSchedule) {
      const session = JSON.parse(result.attributes.metadata.bookedSchedule) as DateSession & { ref_no: string };

      const isTaken = await BookingService.checkScheduleAvailability({
        startDate: session.startSession,
        endDate: session.endSession,
      });

      if (isTaken) return { data: null };

      await BookingAttemptRepository.createBookingAttempt({
        startSession: session.startSession,
        endSession: session.endSession,
        ref_no: session.ref_no,
        expireAt: dayjs().add(25, 'm').toDate(),
      });
    }

    return attachPaymentMethodToIntent(data);
  } catch (err) {
    console.log(err);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
};

interface CreateRefundHandler {
  (ref_no: string, reason: string): Promise<{ status: 'MANUAL_PROCESSING' | 'AUTOMATIC_PROCESSING' | 'FAILED' }>;
}

export const createRefundHandler: CreateRefundHandler = async (ref_no: string, reason: string) => {
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
        const refundRecord = await BookingRefundRepository.createBookingRefund({
          paymongoRefundId: null,
          type: 'MANUAL',
          reason: reason,
          status: 'PROCESSING',
        });

        await BookingRepository.updateBooking(bookingRecord.id, { refundId: refundRecord.bookingRefundId });

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
};
