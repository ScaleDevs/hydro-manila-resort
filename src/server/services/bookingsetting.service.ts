import { TRPCError } from '@trpc/server';
import { IBookingSetting, IPaginationInputs } from '@/utils/types';
import { BookingSettingRepository } from '@/server/repository/bookingsetting.repo';

class Service {
  public async createBookingSetting(data: Omit<IBookingSetting, 'bookingSettingId' | 'createdAt'>) {
    try {
      return BookingSettingRepository.createBookingSetting({
        ...data,
      });
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findFirstBookingSetting() {
    try {
      return BookingSettingRepository.findFirstBookingSetting();
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findBookingSettingById(id: string) {
    try {
      return BookingSettingRepository.findBookingSettingById(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findManyBookingSettings(input: IPaginationInputs) {
    try {
      return BookingSettingRepository.findManyBookingSettings(input);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async updateBookingSettingById(
    bookingSettingId: string,
    partialData: Partial<Omit<IBookingSetting, 'bookingSettingId' | 'createdAt'>>,
  ) {
    try {
      return BookingSettingRepository.updateBookingSettingById(bookingSettingId, partialData);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const BookingSettingService = new Service();
