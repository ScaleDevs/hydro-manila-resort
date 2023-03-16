import prisma from './prisma.client';
import { IPaginationInputs, IBookingRefund } from '@/utils/types';

class Respository {
  public async createBookingRefund(data: Omit<IBookingRefund, 'bookingRefundId' | 'createdAt'>) {
    return prisma.bookingRefund.create({ data: { ...data } });
  }

  public async findBookingRefundById(bookingRefundId: string) {
    return prisma.bookingRefund.findFirst({ where: { bookingRefundId } });
  }

  public async findManyRefundRecords({ page, limit }: IPaginationInputs) {
    const result = await prisma.bookingRefund.findMany({
      orderBy: { createdAt: 'desc' },
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    const totalCount = await prisma.bookingRefund.count();

    return {
      pageCount: Math.ceil(totalCount / limit),
      records: result,
    };
  }

  public async updateBookinRefund(bookingRefundId: string, partialData: Partial<IBookingRefund>) {
    return prisma.bookingRefund.update({
      where: { bookingRefundId },
      data: partialData,
    });
  }
}

export const BookingRefundRepository = new Respository();
