import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';
import { DatesInput, IPaginationInputs, IScheduledEvent } from '@/utils/types';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
import { constants } from '../constants';

class Service {
  public async createScheduledEvent(data: Omit<IScheduledEvent, 'scheduledEventId' | 'createdAt'>) {
    try {
      const isSchedTaken = await ScheduledEventRepository.checkIfScheduleIsTaken({
        startDate: data.startSession,
        endDate: data.endSession,
      });

      if (isSchedTaken)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Record already exist :: Conflict Schedule',
        });

      await GoogleCalendarRepository.createEvent({
        summary: data.description,
        description: data.description,
        start: {
          dateTime: dayjs.utc(data.startSession).tz(constants.general.timezone).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
        },
        end: {
          dateTime: dayjs.utc(data.endSession).tz(constants.general.timezone).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
        },
      });

      return ScheduledEventRepository.createScheduledEvent(data);
    } catch (err: any) {
      console.log(err);
      if (err.message === 'Record already exist :: Conflict Schedule')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Schedule Already Filled',
        });
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

  public async findManyScheduledEvent(input: IPaginationInputs & DatesInput) {
    try {
      return ScheduledEventRepository.findManyScheduledEvent(input);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async deleteScheduledEvent(scheduledEventId: string) {
    try {
      return ScheduledEventRepository.deleteScheduledEvent(scheduledEventId);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const ScheduledEventService = new Service();
