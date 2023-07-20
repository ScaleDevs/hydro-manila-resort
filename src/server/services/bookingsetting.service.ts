import { TRPCError } from '@trpc/server';
import { IBookingSetting } from '@/utils/types';
import { BookingSettingRepository } from '@/server/repository/bookingsetting.repo';

class Service {
  public async createBookingSetting(data: Omit<IBookingSetting, 'bookingSettingId' | 'createdAt' | 'updatedAt'>) {
    try {
      const checkIfRecordExist = await BookingSettingRepository.checkBookingSetting();
      if (checkIfRecordExist)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Record already exist :: Only 1 record of booking setting is allowed',
        });
      return BookingSettingRepository.createBookingSetting({
        ...data,
      });
    } catch (err) {
      console.log(err);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const BookingSettingService = new Service();
