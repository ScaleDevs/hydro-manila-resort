import prisma from './prisma.client';
import { IPaginationInputs, IBooking } from '@/utils/types';

export type IFindManyBookingInput = {
  name?: string;
  email?: string;
} & IPaginationInputs;

class Respository {
  public async createBooking(data: Omit<IBooking, 'id' | 'createdAt'>) {
    return prisma.booking.create({ data: { ...data } });
  }

  public async findBookingById(id: string) {
    return prisma.booking.findFirst({ where: { id } });
  }

  public async findBookingByPaymentIntentId(paymentIntentId: string) {
    return prisma.booking.findFirst({ where: { paymentIntentId } });
  }

  public async findManyBooking({ page, limit, name, email }: IFindManyBookingInput) {
    const whereFilter = {
      name: {
        startsWith: name,
      },
      email: {
        startsWith: email,
      },
    };

    const result = await prisma.booking.findMany({
      where: whereFilter,
      orderBy: { name: 'asc' },
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    const totalCount = await prisma.booking.count({
      where: whereFilter,
    });

    return {
      pageCount: Math.ceil(totalCount / limit),
      records: result,
    };
  }

  public async updateBooking(id: string, partialData: Partial<IBooking>) {
    return prisma.booking.update({
      where: { id },
      data: partialData,
    });
  }

  public async deleteBooking(id: string) {
    return prisma.booking.delete({ where: { id } });
  }
}

export const BookingRepository = new Respository();
