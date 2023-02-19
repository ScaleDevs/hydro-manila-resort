import prisma from './prisma.client';
import { Prisma } from '@prisma/client';
import { IPaginationInputs, IBooking, DatesInput } from '@/utils/types';

export type IFindManyBookingInput = {
  ref_no?: string;
} & IPaginationInputs;

export type IBookingDates = {
  [key: string]: {
    start: number;
    end: number;
  }[];
};

class Respository {
  public async createBooking(data: Omit<IBooking, 'id' | 'createdAt'>) {
    return prisma.booking.create({ data: { ...data } });
  }

  public async findBookingById(id: string) {
    return prisma.booking.findFirst({ where: { id } });
  }

  public async findBookingByReferenceNo(refNo: string) {
    return prisma.booking.findFirst({ where: { ref_no: refNo } });
  }

  public async findBookingByPaymentIntentId(paymentIntentId: string) {
    return prisma.booking.findFirst({ where: { paymentIntentId } });
  }

  public async findManyBooking({ page, limit, ref_no }: IFindManyBookingInput) {
    const whereFilter: Prisma.BookingWhereInput = {
      ref_no,
    };

    const result = await prisma.booking.findMany({
      where: whereFilter,
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

  public async checkIfScheduleTaken({ startDate, endDate }: DatesInput) {
    const whereFilter: Prisma.BookingWhereInput = {
      OR: [
        {
          startSession: {
            lte: startDate,
          },
          endSession: {
            gt: startDate,
          },
        },
        {
          startSession: {
            lt: endDate,
          },
          endSession: {
            gte: endDate,
          },
        },
        {
          startSession: {
            gt: startDate,
          },
          endSession: {
            lt: endDate,
          },
        },
      ],
    };

    const totalCount = await prisma.booking.count({
      where: whereFilter,
    });

    return totalCount > 0;
  }

  public async findAllBookingsByDates({ page, limit, startDate, endDate }: IFindManyBookingInput & DatesInput) {
    const whereFilter: Prisma.BookingWhereInput = {
      startSession: {
        gte: startDate,
        lte: endDate,
      },
    };

    const bookingRecords = await prisma.booking.findMany({
      where: whereFilter,
      orderBy: { name: 'asc' },
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    return bookingRecords;
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
