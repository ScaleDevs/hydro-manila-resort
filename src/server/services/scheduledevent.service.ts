import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';
import { DatesInput, IPaginationInputs, IScheduledEvent } from '@/utils/types';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
import { BookingAttemptRepository } from '@/server/repository/bookingattempt.repo';
import { BookingRepository } from '@/server/repository/booking.repo';
import { constants } from '../constants';
import { dateToIsoString } from '@/utils/helper';

class Service {
  public async createScheduledEvent(data: Omit<IScheduledEvent, 'scheduledEventId' | 'createdAt' | 'calendarEventId'>) {
    try {
      const startSession = dateToIsoString(data.startSession);
      const endSession = dateToIsoString(data.endSession);

      const isBookingDateTaken = await BookingRepository.findBookingConflicts({
        startDate: startSession,
        endDate: endSession,
      });

      const isSchedTaken = await ScheduledEventRepository.checkIfScheduleIsTaken({
        startDate: startSession,
        endDate: endSession,
      });

      const isBookingAttemptTaken = await BookingAttemptRepository.checkIfBookingAttemptIsTaken({
        startDate: startSession,
        endDate: endSession,
      });

      if (isBookingDateTaken || isSchedTaken || isBookingAttemptTaken)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Record already exist :: Conflict Schedule',
        });

      const calendarEventId = await GoogleCalendarRepository.createEvent({
        summary: data.description,
        description: data.description,
        start: {
          dateTime: dayjs.utc(startSession).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
          timeZone: constants.general.timezone,
        },
        end: {
          dateTime: dayjs.utc(endSession).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
          timeZone: constants.general.timezone,
        },
      });

      return ScheduledEventRepository.createScheduledEvent({
        ...data,
        startSession,
        endSession,
        calendarEventId,
      });
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

  public async deleteScheduledEvent(scheduledEventId: string, calendarEventId: string | null) {
    try {
      const result = await ScheduledEventRepository.deleteScheduledEvent(scheduledEventId);
      if (calendarEventId) await GoogleCalendarRepository.deleteEvent(calendarEventId);
      return result;
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const ScheduledEventService = new Service();
