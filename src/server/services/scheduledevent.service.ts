import { TRPCError } from '@trpc/server';
import { IPaginationInputs, IScheduledEvent } from '@/utils/types';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';

class Service {
  public async createScheduledEvent(data: Omit<IScheduledEvent, 'scheduledEventId' | 'createdAt'>) {
    try {
      const isSchedAvailable = await ScheduledEventRepository.checkIfScheduleIsAvailable({
        startDate: data.startSession,
        endDate: data.endSession,
      });

      if (isSchedAvailable)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Record already exist :: Conflict Schedule',
        });

      return ScheduledEventRepository.createScheduledEvent(data);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findScheduledEventById(scheduledEventId: string) {
    try {
      return ScheduledEventRepository.findScheduledEventById(scheduledEventId);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findManyScheduledEvent(input: IPaginationInputs) {
    try {
      return ScheduledEventRepository.findManyScheduledEvent(input);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const ScheduledEventService = new Service();
