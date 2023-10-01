import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';
import { IScheduledEvent } from '@/utils/types';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
import { BookingAttemptRepository } from '@/server/repository/bookingattempt.repo';
import { BookingRepository } from '@/server/repository/booking.repo';
import { createReservation, cancelReservation } from '@/server/repository/hostaway.repo';
import { constants } from '../constants';

class Service {
  public async createScheduledEvent(
    data: Omit<IScheduledEvent, 'scheduledEventId' | 'createdAt' | 'calendarEventId' | 'hostawayId'>,
  ) {
    try {
      const startSession = dayjs.tz(data.startSession, constants.general.timezone);
      const endSession = dayjs.tz(data.endSession, constants.general.timezone);
      const startISOString = startSession.toISOString();
      const endISOString = endSession.toISOString();

      const isBookingDateTaken = await BookingRepository.findBookingConflicts({
        startDate: startISOString,
        endDate: endISOString,
      });

      const isSchedTaken = await ScheduledEventRepository.checkIfScheduleIsTaken({
        startDate: startISOString,
        endDate: endISOString,
      });

      const isBookingAttemptTaken = await BookingAttemptRepository.checkIfBookingAttemptIsTaken({
        startDate: startISOString,
        endDate: endISOString,
      });

      if (isBookingDateTaken || isSchedTaken || isBookingAttemptTaken)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Schedule_not_available',
        });

      let hostawayId: null | number = null;

      // add reservation to hostaway
      if (constants.general.appName === 'VillaLeonora') {
        const reservationResult = await createReservation({
          guestName: data.guestName,
          numberOfGuests: data.guests,
          arrivalDate: startSession.format('YYYY-MM-DD'),
          departureDate: endSession.format('YYYY-MM-DD'),
          checkInTime: startSession.hour(),
          checkOutTime: endSession.hour(),
          phone: '+63' + '000000000',
          totalPrice: 0,
        });

        if ('conflict' in reservationResult && reservationResult.message === 'Requested date is not available')
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Schedule_not_available',
          });
        else if ('conflict' in reservationResult)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
        else if ('guestName' in reservationResult) hostawayId = reservationResult.id;
      }

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
        startSession: startISOString,
        endSession: endISOString,
        hostawayId,
        calendarEventId,
      });
    } catch (err: any) {
      console.log(err);
      if (err.message === 'Schedule_not_available')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Schedule Already Filled',
        });
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async deleteScheduledEvent(scheduledEventId: string, calendarEventId: string | null) {
    try {
      const scheduleEventDeleted = await ScheduledEventRepository.deleteScheduledEvent(scheduledEventId);

      if (calendarEventId) await GoogleCalendarRepository.deleteEvent(calendarEventId);
      if (constants.general.appName === 'VillaLeonora' && !!scheduleEventDeleted.hostawayId) {
        const result = await cancelReservation(scheduleEventDeleted.hostawayId.toString(), 'host');
        if ('conflict' in result)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              'System unable to delete the hostaway record for this event. Please delete it directly on your hostaway dashboard',
          });
      }

      return scheduleEventDeleted;
    } catch (err: any) {
      throw new TRPCError({ code: err.code || 'INTERNAL_SERVER_ERROR', message: err.message || 'Something went wrong' });
    }
  }
}

export const ScheduledEventService = new Service();
