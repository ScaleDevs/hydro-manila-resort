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
import { BookingRefundRepository } from '@/repo/bookingrefund.repo';
import { GoogleCalendarRepository } from '@/repo/googlecalender.repo';
import { cancelReservation } from '@/repo/hostaway.repo';
import { notifyFailedHostawayDeletion, processingUpdateEmail, sendRefundEmailProcessing } from '@/repo/mailersend.repo';
import { BookingService } from '@/svc/booking.service';
import { tzSchedToDayJsInsance, utcDateToTzDayInstance } from '@/utils/helper';
import { BookingStatusDisplay, CustomerUpdateBookingParams, IBooking } from '@/utils/types';
import { createGuestsSummary, createReferenceNumber, isIt3DaysBeforeBookingDate } from '@/server/util';
import { constants } from '@/server/constants';
import { createScheduleFromNow } from '../repository/scheduler.repo';

export * as PaymentHandler from './payment.handler';

export const initiatePaymentSessionForBooking = async (input: {
  name: string;
  email: string;
  phoneNumber: string;
  guests: Guests;
  roomIds: string[];
  productId: string;
  bookingDate: string;
  idS3Key: string;
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
      idS3Key: input.idS3Key,
    } as IBooking;

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
          application: constants.general.appName,
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

    if (!!bookingRecord.refundId)
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Update request failed since this booking was already refunded.' });
    if (dayjs.utc(bookingRecord.startSession).unix() < dayjs.utc().unix())
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Update request failed since booking date already passed.',
      });
    if (!!bookingUpdates.bookingDate && isIt3DaysBeforeBookingDate(bookingRecord.startSession))
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Update request failed as it is not allowed to reschedule 3 days before your booking date',
      });

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
          application: constants.general.appName,
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
    const currentPaymentIntent = await getPaymentIntentSession(data.paymentIntentId);

    if (!!currentPaymentIntent.attributes.metadata.bookingUpdateParams) {
      const newPaymentIntent = await attachPaymentMethodToIntent(data);
      const params = JSON.parse(currentPaymentIntent.attributes.metadata.bookingUpdateParams);
      const session = params.currentBookingRecord as IBooking;
      const bookingRequestUpdate = params.updates as {
        productId?: string | undefined;
        rooms?: string[] | undefined;
        guests?: Guests | undefined;
        bookingDate?: string | undefined;
      };
      const oldProduct = await ProductRepository.findProductById(session.productId);
      const newProduct = bookingRequestUpdate.productId
        ? await ProductRepository.findProductById(bookingRequestUpdate.productId)
        : undefined;
      const newRooms = bookingRequestUpdate.rooms ? await RoomRepository.findRoomsByIds(bookingRequestUpdate.rooms) : undefined;
      const modification: { name: string; value: string }[] = [];

      if (!!bookingRequestUpdate.guests)
        modification.push({
          name: 'No. of Guests',
          value: createGuestsSummary({ guests: bookingRequestUpdate.guests }),
        });

      if (!!newRooms)
        modification.push({
          name: 'Rooms',
          value: newRooms.length > 0 ? newRooms.map((v) => v.roomIdentityName).join(', ') : 'None',
        });
      else if (!!newProduct && !!newProduct.isAllRooms)
        modification.push({
          name: 'Rooms',
          value: 'Whole Place',
        });

      if (!!newProduct || bookingRequestUpdate.bookingDate) {
        const product = newProduct || oldProduct;
        const bookingDate = bookingRequestUpdate.bookingDate || utcDateToTzDayInstance(session.startSession).format('YYYY-MM-DD');

        modification.push({
          name: 'Type of Booking',
          value: product.name,
        });

        modification.push({
          name: 'Check-In Date',
          value: tzSchedToDayJsInsance(bookingDate as string, product?.scheduleStart).format('MMM DD, YYYY / hh:mm A'),
        });

        modification.push({
          name: 'Check-Out Date',
          value: tzSchedToDayJsInsance(
            dayjs(bookingDate)
              .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
              .format('YYYY-MM-DD'),
            product.scheduleEnd,
          ).format('MMM DD, YYYY / hh:mm A'),
        });
      }

      await processingUpdateEmail(session.email, { customer_name: session.name, modification });

      return newPaymentIntent;
    }

    if (!currentPaymentIntent.attributes.metadata.bookingRecord) return { data: null };

    const session = JSON.parse(currentPaymentIntent.attributes.metadata.bookingRecord) as IBooking;

    const isTaken = await BookingService.checkScheduleAvailability({
      startDate: session.startSession,
      endDate: session.endSession,
    });

    if (isTaken) return { data: null };

    const url = new URL(constants.cron.serverUrl + '/api/fail_booking');
    const schedName = `${constants.general.appName}_booking_${session.ref_no}`;
    url.searchParams.append('ref_no', session.ref_no);
    url.searchParams.append('sched_name', schedName);

    const [newPaymentIntent] = await Promise.all([
      attachPaymentMethodToIntent(data),
      BookingRepository.createBooking({
        ...session,
        paymentIntentId: currentPaymentIntent.id,
        paymentId: null,
        status: 'PENDING',
        calendarEventId: null,
        refundId: null,
        updateLogs: [],
        transactionLogs: [],
        hostawayId: null,
        createdBy: 'SYSTEM',
      }),
      createScheduleFromNow({
        scheduleName: schedName,
        minutes: 60, // 1hr
        Target: {
          Arn: constants.cron.lambdaArn,
          RoleArn: constants.cron.lambdaRoleArn,
          Input: {
            url: url.toString(),
          },
        },
      }),
    ]);

    return newPaymentIntent;
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

    if (!bookingRecord.paymentId)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No payment found for this booking record!' });
    if (!!bookingRecord.refundId) throw new TRPCError({ code: 'FORBIDDEN', message: 'You have already requested for a refund!' });
    if (dayjs.utc(bookingRecord.startSession).unix() < dayjs.utc().unix())
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This booking is not valid for a refund since its booking date has already passed!',
      });
    if (isIt3DaysBeforeBookingDate(bookingRecord.startSession))
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cancellation request failed as it is not allowed to cancel 3 days before your booking date',
      });

    const { total } = bookingRecord.receipt;

    const isFromAdmin = !!bookingRecord.createdBy && bookingRecord.createdBy !== 'SYSTEM';
    const result = isFromAdmin
      ? null
      : await createRefund({
          amount: total * 100,
          payment_id: bookingRecord.paymentId,
          reason: 'requested_by_customer',
          metadata: {
            application: constants.general.appName,
            reason,
          },
        });
    const isError = !!result && 'error' in result;

    if ((isError && !!['available_balance_insufficient', 'parameter_above_maximum'].includes(result.error)) || isFromAdmin) {
      const refundRecord = await BookingRefundRepository.createBookingRefund({
        paymongoRefundId: null,
        referenceNo: null,
        type: 'MANUAL',
        reason: reason,
        status: 'PROCESSING',
        amount: bookingRecord.receipt.total,
        process: null,
        updatedBy: null,
      });

      await BookingRepository.updateBooking(bookingRecord.id, { refundId: refundRecord.bookingRefundId });

      // SEND EMAIL REGARDING MANUAL PROCESSING OF REFUND - due to balance issue
      await sendRefundEmailProcessing({
        recipientEmail: bookingRecord.email,
        customer_name: bookingRecord.name,
        ref_no: bookingRecord.ref_no,
        amount: bookingRecord.receipt.total,
        messageType: isError ? (result?.error === 'parameter_above_maximum' ? 'ABOVE_MAXIMUM' : 'INSUFFICIENT') : 'FROMADMIN',
      });

      if (bookingRecord.calendarEventId) await GoogleCalendarRepository.deleteEvent(bookingRecord.calendarEventId);

      if (constants.general.appName === 'VillaLeonora' && !!bookingRecord.hostawayId) {
        const result = await cancelReservation(bookingRecord.hostawayId.toString(), 'guest');
        if ('conflict' in result)
          await notifyFailedHostawayDeletion({
            ref_no: bookingRecord.ref_no,
            hostaway_id: bookingRecord.hostawayId.toString(),
          });
      }

      return {
        status: 'MANUAL_PROCESSING',
      };
    } else if (isError && result.error === 'something_went_wrong')
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Something went wrong!' });

    if (bookingRecord.calendarEventId) await GoogleCalendarRepository.deleteEvent(bookingRecord.calendarEventId);

    return {
      status: 'AUTOMATIC_PROCESSING',
    };
  } catch (err) {
    const error = err as any;
    throw new TRPCError({ code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'Something went wrong' });
  }
};
