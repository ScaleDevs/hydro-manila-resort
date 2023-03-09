import { TRPCError } from '@trpc/server';
// import dayjs from 'dayjs';
// import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
// import { BookingRepository } from '@/server/repository/booking.repo';
// import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
// import { BookingRefundRepository } from '@/server/repository/bookingrefund.repo';
// import { constants } from '../constants';
// import { ProductService } from './product.service';
// import { RoomRepository } from '../repository/room.repo';

class Service {
  public async run() {
    try {
      // const result = await BookingRepository.findManyBooking({
      //   page: 1,
      //   limit: 1000,
      //   dateFilter: {
      //     startDate: '2023-02-08T16:00:00.000Z',
      //     endDate: '2023-05-31T15:59:59.999Z',
      //   },
      // });

      // const arrResult = [];

      // for (const record of result.records) {
      //   const refundRecord = await BookingRefundRepository.findBookingRefundByBookingId(record.id);

      //   if (refundRecord) {
      //     console.log('REFUNDED', record.name);
      //     console.log(refundRecord);
      //     continue;
      //   }

      //   const product = await ProductService.findProductById(record.productId);
      //   const productDetails = product?.details[product.activeVersion - 1];
      //   let room = productDetails?.withRooms ? 'ALL ROOMS' : 'NO ROOM';

      //   if (record.roomId) {
      //     const result = await RoomRepository.findRoomById(record.roomId);
      //     if (result) room = result.roomIdentityName;
      //   }

      //   arrResult.push({
      //     name: record.name,
      //     product: product?.name,
      //     room: room,
      //     pax: record.guests,
      //     start: dayjs.utc(record.startSession).tz(constants.general.timezone).format('MMM DD, YYYY hh:mm A'),
      //     end: dayjs.utc(record.endSession).tz(constants.general.timezone).format('MMM DD, YYYY hh:mm A'),
      //   });

      // const calendarEventId = await GoogleCalendarRepository.createEvent({
      //   summary: record.name,
      //   description: `${record.guests ?? 0} PAX / ${room}`,
      //   start: {
      //     dateTime: dayjs.utc(record.startSession).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
      //     timeZone: constants.general.timezone,
      //   },
      //   end: {
      //     dateTime: dayjs.utc(record.endSession).format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
      //     timeZone: constants.general.timezone,
      //   },
      // });

      // await BookingRepository.updateBooking(record.id, { calendarEventId });
      // }

      // console.log('DONE');

      return {
        totalRecords: 0,
        records: [],
      };
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const ScriptService = new Service();
