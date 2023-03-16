import { TRPCError } from '@trpc/server';
// import dayjs from 'dayjs';
// import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
// import { BookingRepository } from '@/server/repository/booking.repo';
// import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
// import { BookingRefundRepository } from '@/server/repository/bookingrefund.repo';
// import { BookingRepository } from '../repository/booking.repo';
// import { constants } from '../constants';
// import { ProductService } from './product.service';
// import { RoomRepository } from '../repository/room.repo';

class Service {
  public async run() {
    try {
      console.log('code here');
      // return {
      //   totalRecords: refundResult.records.length,
      //   records: refundResult.records,
      // };
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const ScriptService = new Service();
