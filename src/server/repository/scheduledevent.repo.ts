import prisma from './prisma.client';
import { IPaginationInputs, IScheduledEvent, DatesInput } from '@/utils/types';
import { Prisma } from '@prisma/client';

export type DateFilters = {
  startSession?: DatesInput;
  endSession?: DatesInput;
};

class Respository {
  public async createScheduledEvent(data: Omit<IScheduledEvent, 'scheduledEventId' | 'createdAt'>) {
    return prisma.scheduledEvent.create({ data: { ...data } });
  }

  public async findScheduledEventById(scheduledEventId: string) {
    return prisma.scheduledEvent.findFirst({ where: { scheduledEventId } });
  }

  public async findManyScheduledEvent({ page, limit, startSession, endSession }: IPaginationInputs & DateFilters) {
    const orFilters = [];

    if (startSession)
      orFilters.push({
        startSession: {
          gte: startSession.startDate,
          lte: startSession.endDate,
        },
      });

    if (endSession)
      orFilters.push({
        endSession: {
          gte: endSession.startDate,
          lte: endSession.endDate,
        },
      });

    const whereFilter: Prisma.ScheduledEventWhereInput = {
      OR: orFilters,
    };

    const result = await prisma.scheduledEvent.findMany({
      where: whereFilter,
      orderBy: { createdAt: 'desc' },
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    const totalCount = await prisma.scheduledEvent.count({ where: whereFilter });

    return {
      pageCount: Math.ceil(totalCount / limit),
      records: result,
    };
  }

  public async findAllScheduledEventByDates({ page, limit, startDate, endDate }: IPaginationInputs & DatesInput) {
    const whereFilter: Prisma.ScheduledEventWhereInput = {
      startSession: {
        gte: startDate,
        lte: endDate,
      },
    };

    const eventsRecords = await prisma.scheduledEvent.findMany({
      where: whereFilter,
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    return eventsRecords;
  }

  public async checkIfScheduleIsTaken({ startDate, endDate }: DatesInput) {
    const whereFilter: Prisma.ScheduledEventWhereInput = {
      OR: [
        {
          startSession: {
            lte: startDate,
          },
          endSession: {
            gte: startDate,
          },
        },
        {
          startSession: {
            lte: endDate,
          },
          endSession: {
            gte: endDate,
          },
        },
        {
          startSession: {
            gte: startDate,
          },
          endSession: {
            lte: endDate,
          },
        },
      ],
    };

    const totalCount = await prisma.scheduledEvent.count({
      where: whereFilter,
    });

    return totalCount > 0;
  }

  public async deleteScheduledEvent(scheduledEventId: string) {
    return prisma.scheduledEvent.delete({ where: { scheduledEventId } });
  }
}

export const ScheduledEventRepository = new Respository();
