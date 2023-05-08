import { BookingRepository } from '@/server/repository/booking.repo';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
import { BookingAttemptRepository } from '@/server/repository/bookingattempt.repo';

class Service {
  public async checkScheduleAvailability({ startDate, endDate }: { startDate: string | Date; endDate: string | Date }) {
    const isBookingDateTaken = await BookingRepository.findBookingConflicts({
      startDate,
      endDate,
    });

    const isEventSchedTaken = await ScheduledEventRepository.checkIfScheduleIsTaken({
      startDate,
      endDate,
    });

    const isBookingAttemptTaken = await BookingAttemptRepository.checkIfBookingAttemptIsTaken({
      startDate,
      endDate,
    });

    return isBookingDateTaken || isEventSchedTaken || isBookingAttemptTaken;
  }
}

export const GlobalService = new Service();
