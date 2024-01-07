import { TRPCError } from '@trpc/server';
import prisma from './prisma.client';
import { IPaginationInputs, IBookingSetting } from '@/utils/types';

class Respository {
  public async createBookingSetting(data: Omit<IBookingSetting, 'bookingSettingId' | 'createdAt' | 'updatedAt'>) {
    return prisma.bookingSetting.create({ data: { ...data } });
  }

  public async checkBookingSetting() {
    try {
      const result = await prisma.bookingSetting.findFirst();
      return result;
    } catch (error: any) {
      throw new TRPCError({
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error :: Repo ==> checkBookingSetting()',
      });
    }
  }
  public async findFirstBookingSetting() {
    try {
      const result = await prisma.bookingSetting.findFirst();
      if (!result) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking Settings not found' });
      return result;
    } catch (error: any) {
      throw new TRPCError({
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error :: Repo ==> findFirstBookingSetting()',
      });
    }
  }

  public async findBookingSettingById(bookingSettingId: string) {
    try {
      return prisma.bookingSetting.findFirst({ where: { bookingSettingId } });
    } catch (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Repo ==> findBookingSettingById()' });
    }
  }

  public async findManyBookingSettings({ page, limit }: IPaginationInputs) {
    try {
      const result = await prisma.bookingSetting.findMany({
        orderBy: { createdAt: 'desc' },
        skip: page > 0 ? (page - 1) * limit : 0,
        take: limit,
      });

      const totalCount = await prisma.bookingSetting.count();

      return {
        pageCount: Math.ceil(totalCount / limit),
        records: result,
      };
    } catch (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Repo ==> findManyBookingSettings()' });
    }
  }

  public async updateBookingSettingById(
    bookingSettingId: string,
    partialData: Partial<Omit<IBookingSetting, 'bookingSettingId' | 'createdAt'>>,
  ) {
    try {
      return prisma.bookingSetting.update({
        where: { bookingSettingId },
        data: partialData,
      });
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Repo ==> updateBookingSettingById()' });
    }
  }
}

export const BookingSettingRepository = new Respository();
