import prisma from './prisma.client';
import { IPaginationInputs, IBookingSetting } from '@/utils/types';

class Respository {
  public async createBookingSetting(data: Omit<IBookingSetting, 'bookingSettingId' | 'createdAt'>) {
    return prisma.bookingSetting.create({ data: { ...data } });
  }

  public async findFirstBookingSetting() {
    return prisma.bookingSetting.findFirst();
  }

  public async findBookingSettingById(bookingSettingId: string) {
    return prisma.bookingSetting.findFirst({ where: { bookingSettingId } });
  }

  public async findManyBookingSettings({ page, limit }: IPaginationInputs) {
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
  }

  public async updateBookingSettingById(
    bookingSettingId: string,
    partialData: Partial<Omit<IBookingSetting, 'bookingSettingId' | 'createdAt'>>,
  ) {
    return prisma.bookingSetting.update({
      where: { bookingSettingId },
      data: partialData,
    });
  }
}

export const BookingSettingRepository = new Respository();
