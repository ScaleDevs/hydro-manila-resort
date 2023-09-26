import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';
import { Guests } from '@prisma/client';

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
import { deleteReservation } from '@/repo/hostaway.repo';
import { notifyFailedHostawayDeletion, sendRefundEmailProcessing } from '@/repo/mailersend.repo';
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
  guests: Guests;
  roomIds: string[];
  productId: string;
  bookingDate: string;
}) => {
  try {
    const product = await ProductRepository.findProductById(input.productId);
    const finalRoomIds = Array.from(
      new Map<string, string>([...input.roomIds.map((v) => [v, v]), ...product.includedRooms.map((v) => [v, v])] as [
        string,
        string,
      ][]),
      (entry) => entry[1],
    );
    const rooms = await RoomRepository.findRoomsByIds(finalRoomIds);
    const startSessionDayInstance = tzSchedToDayJsInsance(input.bookingDate, product.scheduleStart);
    const endSessionDayInstance = tzSchedToDayJsInsance(
      dayjs(input.bookingDate)
        .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
        .format('YYYY-MM-DD'),
      product.scheduleEnd,
    );
    const receipt = await BookingService.getBookingDetailsTotal({
      bookedDate: startSessionDayInstance.format('YYYY-MM-DD'),
      product,
      rooms,
      guests: input.guests,
    });

    const data = {
      name: input.name,
      email: input.email,
      phoneNumber: input.phoneNumber,
      guests: input.guests,
      rooms: finalRoomIds,
      productId: input.productId,
      startSession: startSessionDayInstance.toISOString(),
      endSession: endSessionDayInstance.toISOString(),
      receipt,
    };

    const refNo = createReferenceNumber();

    const statusDisplay = {
      ref_no: refNo,
      customerName: input.name,
      guests: input.guests,
      bookedDate: startSessionDayInstance.format('MMM DD, YYYY hh:mm A'),
      checkOutDate: endSessionDayInstance.format('MMM DD, YYYY hh:mm A'),
      scheduleType: product.name,
      roomName: product.isAllRooms ? 'Whole Place' : rooms.map((v) => v.roomIdentityName).join(', '),
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
    const error = err as any;
    throw new TRPCError({ code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'Something went wrong' });
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
    const roomIds = bookingUpdates.rooms || bookingRecord.rooms;
    const rooms = await RoomRepository.findRoomsByIds(roomIds);
    let bookedSchedule = '';
    const bookingDate =
      (bookingUpdates.bookingDate as string) || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD');
    const statusDisplay = {
      ref_no: bookingRecord.ref_no,
      customerName: bookingRecord.name,
      guests: bookingUpdates.guests || bookingRecord.guests,
      bookedDate: '',
      checkOutDate: '',
      scheduleType: product.name,
      roomName: product.isAllRooms ? 'Whole Place' : rooms.map((info) => info.roomIdentityName).join(', '),
    } as BookingStatusDisplay;

    if (bookingUpdates.bookingDate || bookingUpdates.productId) {
      const startSessionDayInstance = tzSchedToDayJsInsance(bookingDate, product.scheduleStart);
      const endSessionDayInstance = tzSchedToDayJsInsance(
        dayjs(bookingDate)
          .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
          .format('YYYY-MM-DD'),
        product.scheduleEnd,
      );

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

    const receipt = await BookingService.getBookingDetailsTotal({
      bookedDate: (bookingUpdates.bookingDate as string) || bookingDate,
      product,
      rooms,
      guests: bookingUpdates.guests || bookingRecord.guests,
    });

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
    const error = err as any;
    throw new TRPCError({ code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'Something went wrong' });
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
    const error = err as any;
    throw new TRPCError({ code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'Something went wrong' });
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
      if (!!['available_balance_insufficient', 'parameter_above_maximum'].includes(result.error)) {
        const refundRecord = await BookingRefundRepository.createBookingRefund({
          paymongoRefundId: null,
          referenceNo: null,
          type: 'MANUAL',
          reason: reason,
          status: 'PROCESSING',
          amount: bookingRecord.receipt.total,
        });

        await BookingRepository.updateBooking(bookingRecord.id, { refundId: refundRecord.bookingRefundId });

        // SEND EMAIL REGARDING MANUAL PROCESSING OF REFUND - due to balance issue
        await sendRefundEmailProcessing({
          recipientEmail: bookingRecord.email,
          customer_name: bookingRecord.name,
          ref_no: bookingRecord.ref_no,
          amount: bookingRecord.receipt.total,
          isParameterAboveMaximum: result.error === 'parameter_above_maximum',
        });

        if (bookingRecord.calendarEventId) await GoogleCalendarRepository.deleteEvent(bookingRecord.calendarEventId);

        if (constants.general.appName === 'VillaLeonora' && !!bookingRecord.hostawayId) {
          const result = await deleteReservation(bookingRecord.hostawayId.toString());
          if ('conflict' in result)
            await notifyFailedHostawayDeletion({
              ref_no: bookingRecord.ref_no,
              hostaway_id: bookingRecord.hostawayId.toString(),
            });
        }

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
    const error = err as any;
    throw new TRPCError({ code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'Something went wrong' });
  }
};
