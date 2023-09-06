import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { Guests } from '@prisma/client';

import { tzSchedToDayJsInsance, utcDateToTzDayInstance } from '@/utils/helper';
import { BookingRepository, IBookingDates } from '@/repo/booking.repo';
import { ProductRepository } from '@/repo/product.repo';
import { RoomRepository } from '@/repo/room.repo';
import { bookingUpdateNoAdditionalPaymentConfirmation } from '@/repo/mailersend.repo';
import { BookingAttemptRepository } from '@/repo/bookingattempt.repo';
import { ScheduledEventRepository } from '@/repo/scheduledevent.repo';
import { BookingService } from '@/svc/booking.service';
import { createGuestsSummary } from '../util';

export * as BookingHandler from './booking.handler';

export const getBookingByRefNoPublic = async (refNo: string) => {
  const booking = await BookingRepository.findBookingByReferenceNo(refNo);
  const bookingInfo = await BookingService.extendedBookingInstance(booking);

  return {
    guests: bookingInfo.guests,
    startSession: bookingInfo.startSession,
    endSession: bookingInfo.endSession,
    productId: bookingInfo.productId,
    rooms: bookingInfo.rooms,
    product: bookingInfo.product,
    roomsObject: bookingInfo.roomsObject,
    currentTotal: bookingInfo.receipt.total,
  };
};

export const getBookingByRefNo = async (refNo: string) => {
  const booking = await BookingRepository.findBookingByReferenceNo(refNo);
  const bookingInfo = await BookingService.extendedBookingInstance(booking);
  return bookingInfo;
};

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
};

export const updateBookingHandler = async (
  bookingId: string,
  data: {
    bookingDate?: string | undefined;
    guests?: Guests | undefined;
    rooms?: string[];
    productId?: string | undefined;
  },
) => {
  const { bookingDate, ...updateData } = data;
  const bookingRecord = await BookingRepository.findBookingById(bookingId);
  const roomIds = data.rooms || bookingRecord.rooms;
  const product = await ProductRepository.findProductById(data.productId || bookingRecord.productId);
  const rooms = await RoomRepository.findRoomsByIds(roomIds);

  const updateLogs = await BookingService.buildBookingDetailsUpdateLog(bookingRecord, updateData, 'ADMIN');
  const result = await BookingService.buildScheduleAndUpdateLog({
    bookingRecord,
    updatedBookedDate: bookingDate,
    updatedProductId: data.productId,
    updatedBy: 'ADMIN',
    product,
  });
  const receipt = await BookingService.getBookingDetailsTotal({
    bookedDate: bookingDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD'),
    product,
    rooms,
    guests: data.guests || bookingRecord.guests,
  });

  const newBookingData = await BookingService.updateBooking({
    bookingId: bookingRecord.id,
    product,
    rooms: rooms.map((info) => info.roomIdentityName),
    data: {
      ...updateData,
      rooms: data.rooms,
      updateLogs: [...bookingRecord.updateLogs, ...updateLogs, ...result.updateLogs],
      startSession: result.startSessionISOString,
      endSession: result.endSessionISOString,
      receipt: { ...receipt },
    },
  });

  if (!newBookingData)
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Handler ==> updateBookingHandler()' });

  return BookingService.extendedBookingInstance(newBookingData);
};

export const customerUpdateRequestHandler = async (input: {
  customerInfo?: {
    bankType: string;
    accountNo: string;
    accountName: string;
  };
  bookingRefNo: string;
  bookingRequestUpdate: {
    productId?: string | undefined;
    rooms?: string[] | undefined;
    guests?: Guests | undefined;
    bookingDate?: string | undefined;
  };
}) => {
  const { productId: newProductId, rooms: newRoomIds, guests: updatedGuests, bookingDate } = input.bookingRequestUpdate;
  const bookingRecord = await BookingService.findBookingByReferenceNo(input.bookingRefNo);
  const newProduct = newProductId ? await ProductRepository.findProductById(newProductId) : undefined;
  const newRooms = newRoomIds ? await RoomRepository.findRoomsByIds(newRoomIds) : undefined;
  const oldProduct = await ProductRepository.findProductById(bookingRecord.productId);
  const oldRooms = bookingRecord.rooms.length > 0 ? await RoomRepository.findRoomsByIds(bookingRecord.rooms) : undefined;
  const oldRoomsNames = oldRooms?.map((info) => info.roomIdentityName);
  const newRoomsNames = newRooms?.map((info) => info.roomIdentityName);
  const roomNames = newRoomsNames || oldRoomsNames || [];
  const currentTotal = bookingRecord.receipt.total;
  const { total: newTotal } = await BookingService.getBookingDetailsTotal({
    bookedDate: bookingDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD'),
    product: newProduct || oldProduct,
    rooms: newRooms || oldRooms || [],
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
      oldRooms: oldRoomsNames,
      newProduct,
      newRooms: newRoomsNames,
    });
  } else if (currentTotal === newTotal) {
    // no additional payment
    const updateData = { ...input.bookingRequestUpdate };
    if (!!updateData.bookingDate) delete updateData.bookingDate;

    const updateLogs = await BookingService.buildBookingDetailsUpdateLog(bookingRecord, updateData, 'ADMIN');

    const result = await BookingService.buildScheduleAndUpdateLog({
      bookingRecord,
      updatedBookedDate: bookingDate,
      updatedBy: 'CUSTOMER',
      product: oldProduct,
    });

    await BookingService.updateBooking({
      bookingId: bookingRecord.id,
      product: newProduct || oldProduct,
      rooms: roomNames || [],
      data: {
        ...updateData,
        startSession: result.startSessionISOString,
        endSession: result.endSessionISOString,
        updateLogs: [...bookingRecord.updateLogs, ...updateLogs, ...result.updateLogs],
      },
    });

    const newGuests = updatedGuests || bookingRecord.guests;

    await bookingUpdateNoAdditionalPaymentConfirmation(bookingRecord.email, {
      reference_no: bookingRecord.ref_no,
      customer_name: bookingRecord.name,
      guests: createGuestsSummary({ guests: newGuests }),
      booking_type: (newProduct || oldProduct).name,
      rooms: (newProduct || oldProduct).isAllRooms ? 'Whole Place' : roomNames.length > 0 ? roomNames.join(', ') : 'No Rooms',
      check_in_date: result.startSession.format('MMM DD, YYYY hh:mm A'),
      check_out_date: result.endSession.format('MMM DD, YYYY hh:mm A'),
    });
  }

  return true;
};

export const checkBookingAvailability = async (input: { productId: string; bookingDate: string }) => {
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
};
