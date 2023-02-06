import prisma from './prisma.client';
import { Prisma } from '@prisma/client';
import { IPaginationInputs, IBooking } from '@/utils/types';
import dayjs from 'dayjs';

export type IFindManyBookingInput = {
  name?: string;
  email?: string;
  startDate?: string;
  endDate?: string;
} & IPaginationInputs;

export type DatesInput = {
  startDate: string | Date;
  endDate: string | Date;
};

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

  public async findManyBooking({ page, limit, startDate, endDate }: IFindManyBookingInput) {
    const whereFilter: Prisma.BookingWhereInput = {
      startSession: {
        gte: startDate,
        lte: endDate,
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

  public async checkIfScheduleIsAvailable({ startDate, endDate }: DatesInput) {
    const whereFilter: Prisma.BookingWhereInput = {
      OR: [
        {
          startSession: {
            gte: startDate,
          },
          endSession: {
            lte: startDate,
          },
        },
        {
          startSession: {
            gte: endDate,
          },
          endSession: {
            lte: endDate,
          },
        },
        {
          startSession: {
            lte: startDate,
          },
          endSession: {
            gte: endDate,
          },
        },
      ],
    };

    const totalCount = await prisma.booking.count({
      where: whereFilter,
    });

    return totalCount > 0 ? false : true;
  }

  public async findAllBookingsByDates({ page, limit, startDate, endDate }: IFindManyBookingInput) {
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

    const totalCount = await prisma.booking.count({
      where: whereFilter,
    });

    const bookedDates: IBookingDates = {};

    for (const booking of bookingRecords) {
      const keyStart = dayjs(booking.startSession).format('YYYY-MM-DD');
      const keyEnd = dayjs(booking.endSession).format('YYYY-MM-DD');
      const value = {
        start: dayjs(booking.startSession).unix(),
        end: dayjs(booking.endSession).unix(),
      };

      if (!bookedDates[keyStart]) bookedDates[keyStart] = [];
      if (!bookedDates[keyEnd]) bookedDates[keyEnd] = [];

      bookedDates[keyStart].push(value);
      bookedDates[keyEnd].push(value);
    }

    return {
      pageCount: Math.ceil(totalCount / limit),
      bookedDates,
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
