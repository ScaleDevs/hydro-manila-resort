import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';

import { tzSchedToDayJsInsance } from '@/utils/helper';
import { BookingRepository, IBookingDates } from '@/repo/booking.repo';
import { ProductRepository } from '@/repo/product.repo';
import { RoomRepository } from '@/repo/room.repo';
import { bookingDateChangeConfirmation } from '@/repo/mailersend.repo';
import { BookingAttemptRepository } from '@/repo/bookingattempt.repo';
import { ScheduledEventRepository } from '@/repo/scheduledevent.repo';
import { BookingService } from '@/svc/booking.service';
import { constants } from '@/server/constants';

export * as BookingHandler from './booking.handler';

export const getBookingByRefNoPublic = async (refNo: string) => {
  const bookingInfo = await BookingService.findBookingByReferenceNo(refNo);

  return {
    guests: bookingInfo.guests,
    startSession: bookingInfo.startSession,
    endSession: bookingInfo.endSession,
    productId: bookingInfo.productId,
    roomId: bookingInfo.roomId,
    currentTotal: bookingInfo.receipt.total,
  };
}

export const findAllBookingsByDates = async (inputs: { startDate: string; endDate: string }) => {
  try {
    const getRecordsParams = {
      ...inputs,
      page: 1,
      limit: 1000,
    };

    const bookingRecords = await BookingRepository.findAllBookingsByDates(getRecordsParams);

    const eventsRecords = await ScheduledEventRepository.findAllScheduledEventByDates(getRecordsParams);

    const bookingAttemptRecords = await BookingAttemptRepository.findAllBookingAttemptsByDates(getRecordsParams);

    const bookedDates: IBookingDates = {};

    for (const record of [...bookingRecords, ...eventsRecords, ...bookingAttemptRecords]) {
      if ('id' in record) if (!!record.refundId) continue;

      const keyStart = dayjs(record.startSession).format('YYYY-MM-DD');
      const keyEnd = dayjs(record.endSession).format('YYYY-MM-DD');
      const value = {
        start: dayjs.utc(record.startSession).unix(),
        end: dayjs.utc(record.endSession).unix(),
      };
      if (!bookedDates[keyStart]) bookedDates[keyStart] = [];
      if (!bookedDates[keyEnd]) bookedDates[keyEnd] = [];

      bookedDates[keyStart].push(value);
      if (keyStart !== keyEnd) bookedDates[keyEnd].push(value);
    }

    return { bookedDates };
  } catch (err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
}

export const updateBookingHandler = async (bookingId: string, data: {
  bookingDate?: string | undefined;
  guests?: number | undefined;
  roomId?: string | null | undefined;
  productId?: string | undefined;
}) => {
  const bookingRecord = await BookingRepository.findBookingById(bookingId);

  const roomId = data.roomId || bookingRecord.roomId;
  const product = await ProductRepository.findProductById(data.productId || bookingRecord.productId);
  const room = roomId ? await RoomRepository.findRoomById(roomId) : undefined;

  const updateLogs = await BookingService.buildBookingDetailsUpdateLog(bookingRecord, data, 'ADMIN');
  const result = await BookingService.buildScheduleAndUpdateLog({
    bookingRecord,
    updatedBookedDate: data.bookingDate,
    updatedProductId: data.productId,
    updatedBy: 'ADMIN',
    product,
  });
  const receipt = await BookingService.getBookingDetailsTotal({
    product,
    room: room || undefined,
    guests: data.guests || bookingRecord.guests,
  });

  await BookingService.updateBooking({
    bookingId: bookingRecord.id,
    product,
    room,
    data: {
      ...data,
      roomId,
      updateLogs: [...bookingRecord.updateLogs, ...updateLogs, ...result.updateLogs],
      startSession: result.startSession,
      endSession: result.endSession,
      receipt: { ...receipt },
    },
  });
};

export const customerUpdateRequestHandler = async (input: {
  customerInfo?: {
      bankType: string;
      accountNo: string;
      accountName: string;
  } | undefined;
  bookingRefNo: string;
  bookingRequestUpdate: {
      productId?: string | undefined;
      roomId?: string | null | undefined;
      guests?: number | undefined;
      bookingDate?: string | undefined;
  };
}) => {
  const bookingRecord = await BookingService.findBookingByReferenceNo(input.bookingRefNo);

  const { productId: newProductId, roomId: newRoomId, guests: updatedGuests, bookingDate } = input.bookingRequestUpdate;
  const newProduct = newProductId ? await ProductRepository.findProductById(newProductId) : undefined;
  const newRoom = newRoomId ? await RoomRepository.findRoomById(newRoomId) : undefined;
  const oldProduct = await ProductRepository.findProductById(bookingRecord.productId);
  const oldRoom = bookingRecord.roomId ? await RoomRepository.findRoomById(bookingRecord.roomId) : undefined;

  const currentTotal = bookingRecord.receipt.total;
  const { total: newTotal } = await BookingService.getBookingDetailsTotal({
    product: newProduct || oldProduct,
    room: newRoom || oldRoom || undefined,
    guests: updatedGuests || bookingRecord.guests,
  });

  if (currentTotal > newTotal && input.customerInfo) {
    // partial refund
    await BookingService.updateBookingPartialRefundCase({
      bookingRecord,
      bookingRequestUpdate: input.bookingRequestUpdate,
      customerInfo: input.customerInfo,
      newTotal,
      oldProduct,
      oldRoom,
      newProduct,
      newRoom,
    });
  } else if (currentTotal === newTotal && !!input.bookingRequestUpdate.bookingDate) {
    // no additional payment / partial refund
    const result = await BookingService.buildScheduleAndUpdateLog({
      bookingRecord,
      updatedBookedDate: bookingDate,
      updatedBy: 'CUSTOMER',
      product: oldProduct,
    });

    await BookingService.updateBooking({
      bookingId: bookingRecord.id,
      product: oldProduct,
      room: oldRoom,
      data: {
        updateLogs: [...bookingRecord.updateLogs, ...result.updateLogs],
        startSession: result.startSession,
        endSession: result.endSession,
      },
    });

    await bookingDateChangeConfirmation(bookingRecord.email, {
      customerName: bookingRecord.name,
      reference_no: bookingRecord.ref_no,
      fromDate: dayjs.utc(bookingRecord.startSession).tz(constants.general.timezone).format('MMM DD, YYYY hh:mm A'),
      toDate: dayjs.utc(result.startSession).tz(constants.general.timezone).format('MMM DD, YYYY hh:mm A'),
    });
  }

  return true;
}

export const checkBookingAvailability = async (input: {
  productId: string;
  bookingDate: string;
}) => {
  const product = await ProductRepository.findProductById(input.productId);
  if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product Not Found!' });

  const endDate = dayjs(input.bookingDate)
    .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
    .format('YYYY-MM-DD');

  const startSession = tzSchedToDayJsInsance(input.bookingDate, product.scheduleStart).toISOString();
  const endSession = tzSchedToDayJsInsance(endDate, product.scheduleEnd).toISOString();

  return BookingService.checkScheduleAvailability({
    startDate: startSession,
    endDate: endSession,
  });
}
