import { v4 } from 'uuid';
import { IBooking } from '@/utils/types';
import dayjs from 'dayjs';
import { IFindManyBookingInput, BookingRepository, IBookingDates } from '@/server/repository/booking.repo';
import { TRPCError } from '@trpc/server';
import { ScheduledEventRepository } from '../repository/scheduledevent.repo';

class Service {
  public async createBooking(data: Omit<IBooking, 'id' | 'createdAt' | 'ref_no'>) {
    try {
      return BookingRepository.createBooking({
        ...data,
        ref_no: v4(),
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
      return BookingRepository.findBookingByReferenceNo(refNo);
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
      const bookingRecords = await BookingRepository.findAllBookingsByDates({
        ...inputs,
        page: 1,
        limit: 1000,
      });

      const eventsRecords = await ScheduledEventRepository.findAllScheduledEventByDates({
        ...inputs,
        page: 1,
        limit: 1000,
      });

      const bookedDates: IBookingDates = {};

      for (const record of [...bookingRecords, ...eventsRecords]) {
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
