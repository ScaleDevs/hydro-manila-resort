import prisma from './prisma.client';
import { Prisma, TransactionLog } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { IPaginationInputs, IBooking, DatesInput } from '@/utils/types';

export type IFindManyBookingInput = {
  ref_no?: string;
  dateFilter?: DatesInput;
} & IPaginationInputs;

export type IBookingDates = {
  [key: string]: {
    start: number;
    end: number;
  }[];
};

const logger = (funcName: string, message: string) => {
  console.log(`booking.repo.ts :: (${funcName}) :: ${message}`);
};

class Respository {
  public async createBooking(data: Omit<IBooking, 'id' | 'createdAt'>) {
    try {
      return prisma.booking.create({ data: { ...data } });
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Repo ==> createBooking()' });
    }
  }

  public async findBookingById(id: string) {
    const booking = await prisma.booking.findFirst({ where: { id } });
    if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking Record not found' });
    return booking;
  }

  public async findBookingByIdPartial(id: string) {
    const booking = await prisma.booking.findFirst({ where: { id }, select: { status: true, ref_no: true } });
    if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking Record not found' });
    return booking;
  }

  public async findBookingByReferenceNo(refNo: string) {
    const booking = await prisma.booking.findFirst({ where: { ref_no: refNo } });
    if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'No Booking Record Found' });
    return booking;
  }

  public async findBookingByReferenceNoPartial(refNo: string) {
    const booking = await prisma.booking.findFirst({
      where: { ref_no: refNo },
      select: {
        id: true,
        status: true,
      },
    });
    if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'No Booking Record Found' });
    return booking;
  }

  public async findBookingByPaymentIntentId(paymentIntentId: string) {
    const booking = await prisma.booking.findFirst({ where: { paymentIntentId } });
    return booking;
  }

  public async findBookingByPaymentIntentIdWithPartial(paymentIntentId: string) {
    const booking = await prisma.booking.findFirst({
      where: { paymentIntentId },
      select: {
        id: true,
        status: true,
        ref_no: true,
      },
    });
    return booking;
  }

  public async findManyBooking({
    page,
    limit,
    ref_no,
    dateFilter,
    status,
  }: IFindManyBookingInput & { status: 'ALL' | 'BOOKED' | 'FAILED' | 'PENDING' | 'REFUNDED' }) {
    try {
      const whereFilter: Prisma.BookingWhereInput = {};

      if (!!ref_no) whereFilter.ref_no = ref_no;
      else if (dateFilter)
        whereFilter['AND'] = [
          {
            startSession: {
              gte: dateFilter.startDate,
              lte: dateFilter.endDate,
            },
          },
          {
            endSession: {
              gte: dateFilter.startDate,
              lte: dateFilter.endDate,
            },
          },
          {
            status: status === 'ALL' ? undefined : status,
          },
        ];

      logger('findManyBooking', 'Querying ...');

      const [result, totalCount] = await Promise.all([
        prisma.booking.findMany({
          where: whereFilter,
          orderBy: [{ startSession: 'asc' }],
          skip: page > 0 ? (page - 1) * limit : 0,
          take: limit,
        }),
        prisma.booking.count({
          where: whereFilter,
        }),
      ]);

      logger('findManyBooking', 'Querying Successful');

      return {
        pageCount: Math.ceil(totalCount / limit),
        records: result,
      };
    } catch (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Repo ==> findManyBooking()' });
    }
  }

  public async findBookingConflicts({ startDate, endDate, bookingId }: DatesInput & { bookingId?: string }) {
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

    let result = await prisma.booking.findMany({
      where: whereFilter,
    });

    if (!!bookingId) result = result.filter((v) => v.id !== bookingId);

    if (result.length === 0) return false;

    let isConflict = false;

    for (const booking of result) {
      if (!!booking.refundId) continue;
      if (booking.status === 'FAILED') continue;
      isConflict = true;
    }

    return isConflict;
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

  public async addTransactionLog(id: string, transactionLog: TransactionLog) {
    return prisma.booking.update({
      where: { id },
      data: {
        transactionLogs: {
          push: transactionLog,
        },
      },
    });
  }

  public async deleteBooking(id: string) {
    try {
      return prisma.booking.delete({ where: { id } });
    } catch (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Repo ==> deleteBooking()' });
    }
  }
}

export const BookingRepository = new Respository();
