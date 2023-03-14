import prisma from './prisma.client';
import { IBookingAttempt, DatesInput, IPaginationInputs } from '@/utils/types';
import { Prisma } from '@prisma/client';

class Respository {
  public async createBookingAttempt(data: Omit<IBookingAttempt, 'bookingAttemptId' | 'createdAt'>) {
    return prisma.bookingAttempt.create({ data: { ...data } });
  }

  public async findBookingAttemptByRefNo(ref_no: string) {
    return prisma.bookingAttempt.findFirst({ where: { ref_no } });
  }

  public async checkIfBookingAttemptIsTaken({ startDate, endDate }: DatesInput) {
    const whereFilter: Prisma.ScheduledEventWhereInput = {
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

    const totalCount = await prisma.bookingAttempt.count({
      where: whereFilter,
    });

    return totalCount > 0;
  }

  public async findAllBookingAttemptsByDates({ page, limit, startDate, endDate }: IPaginationInputs & DatesInput) {
    const whereFilter: Prisma.BookingWhereInput = {
      startSession: {
        gte: startDate,
        lte: endDate,
      },
    };

    const records = await prisma.bookingAttempt.findMany({
      where: whereFilter,
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    return records;
  }

  public async deleteBookingAttemptWithRefNo(ref_no: string) {
    return prisma.bookingAttempt.delete({ where: { ref_no } });
  }
}

export const BookingAttemptRepository = new Respository();
