import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { BookingUpdateLog, ProductDetails } from '@prisma/client';
import { calendar_v3 } from 'googleapis';

import { utcDateToTzDayInstance, tzSchedToDayJsInsance, buildGoogleCalendarDateTime } from '@/utils/helper';
import { IBooking, IProduct, IRoom } from '@/utils/types';
import { IFindManyBookingInput, BookingRepository, IBookingDates } from '@/server/repository/booking.repo';
import { ProductRepository } from '@/server/repository/product.repo';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
import { RoomRepository } from '@/server/repository/room.repo';
import { BookingAttemptRepository } from '@/server/repository/bookingattempt.repo';
import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
import { constants } from '../constants';

class Service {
  public async createBooking(data: Omit<IBooking, 'id' | 'createdAt'>) {
    try {
      return BookingRepository.createBooking({
        ...data,
      });
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findBookingById(id: string) {
    try {
      return BookingRepository.findBookingById(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findBookingByReferenceNo(refNo: string) {
    try {
      const booking = await BookingRepository.findBookingByReferenceNo(refNo);

      if (!booking) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No Booking Record Found' });

      const product = await ProductRepository.findProductById(booking.productId);

      if (!product) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No Product Record Found' });

      const bookingResult: typeof booking & { product: IProduct } & { room?: IRoom } = {
        ...booking,
        product,
      };

      if (booking.roomId) {
        const room = await RoomRepository.findRoomById(booking.roomId);
        bookingResult['room'] = room || undefined;
      }

      return bookingResult;
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findBookingByPaymentIntentId(paymentIntentId: string) {
    try {
      return BookingRepository.findBookingByPaymentIntentId(paymentIntentId);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findManyBooking(inputs: IFindManyBookingInput) {
    try {
      return BookingRepository.findManyBooking(inputs);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findAllBookingsByDates(inputs: { startDate: string; endDate: string }) {
    try {
      const getRecordsParams = {
        ...inputs,
        page: 1,
        limit: 1000,
      };

      const bookingRecords = await BookingRepository.findAllBookingsByDates(getRecordsParams);

      const eventsRecords = await ScheduledEventRepository.findAllScheduledEventByDates(getRecordsParams);

      const bookingAttemptRecords = await BookingAttemptRepository.findAllBookingAttemptsByDates(getRecordsParams);

      const bookedDates: IBookingDates = {};

      for (const record of [...bookingRecords, ...eventsRecords, ...bookingAttemptRecords]) {
        if ('id' in record) if (!!record.refundId) continue;

        const keyStart = dayjs(record.startSession).format('YYYY-MM-DD');
        const keyEnd = dayjs(record.endSession).format('YYYY-MM-DD');
        const value = {
          start: dayjs.utc(record.startSession).unix(),
          end: dayjs.utc(record.endSession).unix(),
        };
        if (!bookedDates[keyStart]) bookedDates[keyStart] = [];
        if (!bookedDates[keyEnd]) bookedDates[keyEnd] = [];

        bookedDates[keyStart].push(value);
        if (keyStart !== keyEnd) bookedDates[keyEnd].push(value);
      }

      return { bookedDates };
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async deleteBooking(id: string) {
    try {
      return BookingRepository.deleteBooking(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async buildBookingDetailsUpdateLog(
    bookingRecord: IBooking,
    data: {
      guests?: number | undefined;
      roomId?: string | null | undefined;
      roomVersion?: number | undefined;
      productId?: string | undefined;
      productVersion?: number | undefined;
    },
  ) {
    try {
      const entries = Object.entries(data);
      const updateLog: BookingUpdateLog[] = [];

      for (const entry of entries) {
        const fieldUpdated = entry[0] as keyof typeof data;

        updateLog.push({
          updatedBy: 'ADMIN',
          fieldUpdated,
          fromValue: `${bookingRecord[fieldUpdated]}`,
          toValue: `${entry[1]}`,
          createdAt: dayjs().toDate(),
        });
      }

      return updateLog;
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - buildBookingDetailsUpdateLog' });
    }
  }

  public async updateBookingSchedule(
    bookingRecord: IBooking,
    data: {
      bookingDate?: string | undefined;
      productId?: string | undefined;
      productVersion?: number | undefined;
    },
  ) {
    try {
      const { productDetails, product } = await ProductRepository.getProductDetails(
        data.productId || bookingRecord.productId,
        data.productVersion,
      );

      const updateLog: BookingUpdateLog[] = [];
      const bookingDate = data.bookingDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD');

      const endDate = dayjs(bookingDate)
        .add(!!productDetails.scheduleEndNextDay ? 1 : 0, 'day')
        .format('YYYY-MM-DD');

      const startSession = tzSchedToDayJsInsance(bookingDate, productDetails.scheduleStart).toISOString();
      const endSession = tzSchedToDayJsInsance(endDate, productDetails.scheduleEnd).toISOString();

      if (!data.bookingDate && !data.productId && !data.productVersion)
        return { updateLog, startSession, endSession, product, productDetails };

      updateLog.push({
        updatedBy: 'ADMIN',
        fieldUpdated: 'startSession',
        fromValue: `${bookingRecord.startSession}`,
        toValue: startSession,
        createdAt: dayjs().toDate(),
      });

      updateLog.push({
        updatedBy: 'ADMIN',
        fieldUpdated: 'endSession',
        fromValue: `${bookingRecord.endSession}`,
        toValue: endSession,
        createdAt: dayjs().toDate(),
      });

      return { updateLog, startSession, endSession, product, productDetails };
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async updateBooking(bookingId: string, product: IProduct, productDetails: ProductDetails, data: Partial<IBooking>) {
    const updatedBooking = await BookingRepository.updateBooking(bookingId, data);
    let chosenRoom: IRoom | null = null;

    if (data.roomId) {
      chosenRoom = await RoomRepository.findRoomById(data.roomId);
      if (!chosenRoom) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found!' });
    }

    const googleCalendarUpdates: calendar_v3.Schema$Event = {
      summary: updatedBooking.name,
      description: `${product?.name} / ${updatedBooking.guests ?? 0} PAX / ${
        chosenRoom?.roomIdentityName ?? (!!productDetails?.withRooms ? 'ALL ROOMS' : 'NO ROOM')
      }`,
    };

    if (!!data.startSession && !!data.endSession) {
      console.log(buildGoogleCalendarDateTime(data.startSession));
      googleCalendarUpdates['start'] = {
        dateTime: buildGoogleCalendarDateTime(data.startSession),
        timeZone: constants.general.timezone,
      };

      googleCalendarUpdates['end'] = {
        dateTime: buildGoogleCalendarDateTime(data.endSession),
        timeZone: constants.general.timezone,
      };
    }

    if (updatedBooking.calendarEventId)
      await GoogleCalendarRepository.updateEvent(updatedBooking.calendarEventId, googleCalendarUpdates);

    return updatedBooking;
  }
}

export const BookingService = new Service();
