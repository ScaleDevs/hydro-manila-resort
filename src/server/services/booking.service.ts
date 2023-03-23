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

  public async rescheduleBooking(id: string, bookingDate: string) {
    try {
      const bookingRecord = await BookingService.findBookingById(id);
      if (!bookingRecord) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking Record not found' });

      const selectedProduct = await ProductRepository.findProductById(bookingRecord.productId);
      if (!selectedProduct) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product Record not found' });

      const productDetails = selectedProduct.details[selectedProduct.activeVersion - 1];
      const endDate = dayjs(bookingDate)
        .add(!!productDetails.scheduleEndNextDay ? 1 : 0, 'day')
        .format('YYYY-MM-DD');

      const startDateSession = tzSchedToDate(bookingDate, productDetails.scheduleStart);
      const endDateSession = tzSchedToDate(endDate, productDetails.scheduleEnd);

      const updateBooking = await BookingRepository.updateBooking(id, {
        startSession: startDateSession.toISOString(),
        endSession: endDateSession.toISOString(),
      });

      if (bookingRecord.calendarEventId)
        await GoogleCalendarRepository.updateEvent(bookingRecord.calendarEventId, {
          start: {
            dateTime: dayjs.utc(startDateSession).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
            timeZone: constants.general.timezone,
          },
          end: {
            dateTime: dayjs.utc(endDateSession).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
            timeZone: constants.general.timezone,
          },
        });

      return updateBooking;
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async updateBooking(id: string, partialData: Partial<IBooking>) {
    try {
      return BookingRepository.updateBooking(id, partialData);
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
