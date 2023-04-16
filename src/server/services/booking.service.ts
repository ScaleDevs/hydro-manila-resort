import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { IBooking, IProduct, IRoom } from '@/utils/types';
import { IFindManyBookingInput, BookingRepository, IBookingDates } from '@/server/repository/booking.repo';
import { ProductRepository } from '@/server/repository/product.repo';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
import { RoomRepository } from '@/server/repository/room.repo';
import { BookingAttemptRepository } from '@/server/repository/bookingattempt.repo';
import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
import { constants } from '../constants';
import { tzSchedToDate } from '../util';
import { BookingUpdateLog } from '@prisma/client';

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

  public async updateBooking(
    id: string,
    data: {
      bookingDate?: string | undefined;
      guests?: number | undefined;
      roomId?: string | null | undefined;
      roomVersion?: number | undefined;
      productId?: string | undefined;
      productVersion?: number | undefined;
    },
  ) {
    try {
      const bookingRecord = await BookingService.findBookingById(id);
      if (!bookingRecord) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking Record not found' });

      const entries = Object.entries(data);
      const updateLog: Omit<BookingUpdateLog, 'createdAt'>[] = [];
      const updateData = { ...data } as any;
      let startSession: dayjs.Dayjs | undefined;
      let endSession: dayjs.Dayjs | undefined;
      delete updateData.bookingDate;

      if (data.bookingDate) {
        const productDetails = await ProductRepository.getProductDetails(
          data.productId || bookingRecord.productId,
          data.productVersion,
        );
        const endDate = dayjs(data.bookingDate)
          .add(!!productDetails.scheduleEndNextDay ? 1 : 0, 'day')
          .format('YYYY-MM-DD');

        startSession = tzSchedToDate(data.bookingDate, productDetails.scheduleStart);
        endSession = tzSchedToDate(endDate, productDetails.scheduleEnd);
      }

      for (const entry of entries) {
        const fieldUpdated = entry[0] as keyof typeof data;

        if (fieldUpdated === 'bookingDate' && startSession && endSession) {
          updateLog.push({
            updatedBy: 'ADMIN',
            fieldUpdated: 'startSession',
            fromValue: `${bookingRecord.startSession}`,
            toValue: startSession.toISOString(),
          });

          updateLog.push({
            updatedBy: 'ADMIN',
            fieldUpdated: 'endSession',
            fromValue: `${bookingRecord.endSession}`,
            toValue: endSession.toISOString(),
          });

          continue;
        }

        if (fieldUpdated !== 'bookingDate')
          updateLog.push({
            updatedBy: 'ADMIN',
            fieldUpdated,
            fromValue: `${bookingRecord[fieldUpdated]}`,
            toValue: `${entry[1]}`,
          });
      }

      const updateBooking = await BookingRepository.updateBooking(bookingRecord.id, {
        ...updateData,
        startSession: startSession?.toISOString(),
        endSession: endSession?.toISOString(),
      });

      if (bookingRecord.calendarEventId && !!startSession && !!endSession)
        await GoogleCalendarRepository.updateEvent(bookingRecord.calendarEventId, {
          start: {
            dateTime: dayjs.utc(startSession).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
            timeZone: constants.general.timezone,
          },
          end: {
            dateTime: dayjs.utc(endSession).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
            timeZone: constants.general.timezone,
          },
        });

      return updateBooking;
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
}

export const BookingService = new Service();
