import prisma from './prisma.client';
import { IPaginationInputs, IScheduledEvent } from '@/utils/types';
import { Prisma } from '@prisma/client';

type DatesInput = {
  startDate: string | Date;
  endDate: string | Date;
};

class Respository {
  public async createScheduledEvent(data: Omit<IScheduledEvent, 'scheduledEventId' | 'createdAt'>) {
    return prisma.scheduledEvent.create({ data: { ...data } });
  }

  public async findScheduledEventById(scheduledEventId: string) {
    return prisma.scheduledEvent.findFirst({ where: { scheduledEventId } });
  }

  public async findManyScheduledEvent({ page, limit }: IPaginationInputs) {
    const result = await prisma.scheduledEvent.findMany({
      orderBy: { createdAt: 'desc' },
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    const totalCount = await prisma.scheduledEvent.count();

    return {
      pageCount: Math.ceil(totalCount / limit),
      records: result,
    };
  }

  public async checkIfScheduleIsAvailable({ startDate, endDate }: DatesInput) {
    const whereFilter: Prisma.ScheduledEventWhereInput = {
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

    const totalCount = await prisma.scheduledEvent.count({
      where: whereFilter,
    });

    return totalCount > 0 ? false : true;
  }
}

export const ScheduledEventRepository = new Respository();
