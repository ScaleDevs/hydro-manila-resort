import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { Guests, ProcessType, TransactionType } from '@prisma/client';

import { getExtraHeads, getExtraHeadsTotal, tzSchedToDayJsInsance, tzSchedToUnix, utcDateToTzDayInstance } from '@/utils/helper';
import { BookingRepository, IBookingDates } from '@/repo/booking.repo';
import { ProductRepository } from '@/repo/product.repo';
import { RoomRepository } from '@/repo/room.repo';
import { bookingUpdateNoAdditionalPaymentConfirmation, sendBookingSuccessEmail } from '@/repo/mailersend.repo';
import { ScheduledEventRepository } from '@/repo/scheduledevent.repo';
import { getReservations, updateReservation } from '@/repo/hostaway.repo';
import { BookingService } from '@/svc/booking.service';
import { PHpeso, createGuestsSummary, isIt3DaysBeforeBookingDate } from '../util';
import { constants } from '../constants';
import { BookingRefundRepository } from '../repository/bookingrefund.repo';

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
    const bookedDates: IBookingDates = {};

    if (constants.general.appName === 'VillaLeonora') {
      const hostawayRecords = await getReservations({
        arrivalStartDate: inputs.startDate.split('T')[0],
        arrivalEndDate: inputs.endDate.split('T')[0],
      });

      if (hostawayRecords)
        for (const record of hostawayRecords.result) {
          if (['new', 'modified', 'ownerStay', 'awaitingPayment', 'awaitingGuestVerification'].includes(record.status)) {
            const keyStart = record.arrivalDate;
            const keyEnd = record.departureDate;
            const value = {
              start: tzSchedToUnix(record.arrivalDate, record.checkInTime),
              end: tzSchedToUnix(record.departureDate, record.checkOutTime),
            };

            if (!bookedDates[keyStart]) bookedDates[keyStart] = [];
            if (!bookedDates[keyEnd]) bookedDates[keyEnd] = [];

            bookedDates[keyStart].push(value);
            if (keyStart !== keyEnd) bookedDates[keyEnd].push(value);
          }
        }
    }

    for (const record of [...bookingRecords, ...eventsRecords]) {
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
    console.error(err);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
};

export const updateBookingHandler = async (
  bookingId: string,
  username: string,
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

  const updateLogs = await BookingService.buildBookingDetailsUpdateLog(bookingRecord, updateData, username);
  const result = await BookingService.buildScheduleAndUpdateLog({
    bookingRecord,
    updatedBookedDate: bookingDate,
    updatedProductId: data.productId,
    updatedBy: username,
    product,
  });
  const receipt = await BookingService.getBookingDetailsTotal({
    bookedDate: bookingDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD'),
    product,
    rooms,
    guests: data.guests || bookingRecord.guests,
  });

  if (constants.general.appName === 'VillaLeonora' && !!bookingRecord.hostawayId) {
    const { overNightGuests, nonOverNightGuests } = updateData.guests || bookingRecord.guests;
    const updateResult = await updateReservation(bookingRecord.hostawayId.toString(), {
      numberOfGuests: overNightGuests + nonOverNightGuests,
      arrivalDate: result.startSession.format('YYYY-MM-DD'),
      departureDate: result.endSession.format('YYYY-MM-DD'),
    });

    if ('conflict' in updateResult && updateResult.message === 'Requested date is not available')
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Requested dates are blocked from hostaway calendar' });
    else if ('conflict' in updateResult)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `${updateResult.message}`,
      });
  }

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

  if (!newBookingData) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong! Kindly Try Again!' });

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

  if (!!bookingRecord.refundId)
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Update request failed since this booking was already refunded.' });
  if (dayjs.utc(bookingRecord.startSession).unix() < dayjs.utc().unix())
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Update request failed since booking date already passed.',
    });
  if (!!bookingDate && isIt3DaysBeforeBookingDate(bookingRecord.startSession))
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Update request failed as it is not allowed to reschedule 3 days before your booking date',
    });

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

    if (constants.general.appName === 'VillaLeonora' && !!bookingRecord.hostawayId) {
      const { overNightGuests, nonOverNightGuests } = updateData.guests || bookingRecord.guests;
      const updateResult = await updateReservation(bookingRecord.hostawayId.toString(), {
        numberOfGuests: overNightGuests + nonOverNightGuests,
        arrivalDate: result.startSession.format('YYYY-MM-DD'),
        departureDate: result.endSession.format('YYYY-MM-DD'),
      });

      if ('conflict' in updateResult && updateResult.message === 'Requested date is not available')
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Requested dates are blocked from hostaway calendar' });
      else if ('conflict' in updateResult)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `${updateResult.message}`,
        });
    }

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

  const startSession = tzSchedToDayJsInsance(input.bookingDate, product.scheduleStart);
  const endSession = tzSchedToDayJsInsance(endDate, product.scheduleEnd);

  if (constants.general.appName === 'VillaLeonora') {
    const hostawayRecords = await getReservations({
      arrivalStartDate: input.bookingDate,
      arrivalEndDate: endDate,
    });

    if (hostawayRecords) {
      const reqStart = startSession.unix();
      const reqEnd = endSession.unix();
      for (const record of hostawayRecords.result)
        if (['new', 'modified', 'ownerStay', 'awaitingPayment', 'awaitingGuestVerification'].includes(record.status)) {
          const checkStart = tzSchedToUnix(record.arrivalDate, record.checkInTime);
          const checkEnd = tzSchedToUnix(record.departureDate, record.checkOutTime);

          if (reqStart <= checkStart && checkStart <= reqEnd) return true;
          if (reqStart <= checkEnd && checkEnd <= reqEnd) return true;
          if (checkStart <= reqStart && reqStart <= checkEnd) return true;
          if (checkStart <= reqEnd && reqEnd <= checkEnd) return true;
        }
    }
  }

  return BookingService.checkScheduleAvailability({
    startDate: startSession.toISOString(),
    endDate: endSession.toISOString(),
  });
};

export const addTransactionLog = async (
  bookingId: string,
  username: string,
  data: {
    refNo: string;
    process: ProcessType;
    type: TransactionType;
    amount: number;
  },
) => {
  const updatedBooking = await BookingRepository.addTransactionLog(bookingId, {
    ...data,
    paymentIntentId: null,
    addedBy: username,
    createdAt: dayjs().toDate(),
  });

  return updatedBooking;
};

export const resetBookingEmailConfirmation = async (bookingId: string) => {
  try {
    const booking = await BookingRepository.findBookingById(bookingId);
    const product = await ProductRepository.findProductById(booking.productId);
    const rooms = await RoomRepository.findRoomsByIds(booking.rooms);
    const bookedDate = dayjs.utc(booking.startSession);
    const checkOutDate = dayjs.utc(booking.endSession);
    const { guestSetting } = product;
    const { guests } = booking;
    const emailAddonsTable: { name: string; price: string; qty: string; summary: string }[] = [];

    const extraOverNightGuestsTotal = getExtraHeadsTotal(
      guests.overNightGuests,
      guestSetting.minOverNightGuestPax,
      guestSetting.overNightGuestFee,
    );
    const extraNonOverNightGuestsTotal = getExtraHeadsTotal(
      guests.nonOverNightGuests,
      guestSetting.minNonOverNightGuestPax,
      guestSetting.nonOverNightGuestFee,
    );
    let addonsTotal = extraOverNightGuestsTotal + extraNonOverNightGuestsTotal;

    if (extraOverNightGuestsTotal > 0)
      emailAddonsTable.push({
        name: 'Additional Overnight Guests',
        price: PHpeso.format(guestSetting.overNightGuestFee),
        qty: `${getExtraHeads(guests.overNightGuests, guestSetting.minOverNightGuestPax)}`,
        summary: PHpeso.format(extraOverNightGuestsTotal),
      });

    if (extraNonOverNightGuestsTotal > 0)
      emailAddonsTable.push({
        name: product.isAllRooms ? 'Additional Non-Overnight Guests' : 'Additional Guests',
        price: PHpeso.format(guestSetting.nonOverNightGuestFee),
        qty: `${getExtraHeads(guests.nonOverNightGuests, guestSetting.minNonOverNightGuestPax)}`,
        summary: PHpeso.format(extraNonOverNightGuestsTotal),
      });

    rooms.forEach((info) => {
      const isNotAddOn = product.includedRooms.some((val) => val === info.roomId);
      addonsTotal += isNotAddOn ? 0 : info.price;
      emailAddonsTable.push({
        name: info.roomIdentityName,
        price: PHpeso.format(info.price),
        qty: '1',
        summary: PHpeso.format(isNotAddOn ? 0 : info.price),
      });
    });
    emailAddonsTable.push({ name: '', price: '', qty: 'Total Extra', summary: PHpeso.format(addonsTotal) });

    await sendBookingSuccessEmail({
      recipientEmail: [booking.email, constants.mailerSend.supportEmail],
      reference_number: booking.ref_no,
      guest_name: booking.name,
      num_pax: guests.overNightGuests + guests.nonOverNightGuests,
      checkin: bookedDate.tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
      checkout: checkOutDate.tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
      booking_type: product.name,
      booking_rate: 'BEST AVAILABLE RATE',
      product_price: PHpeso.format(booking.receipt.productPrice),
      elements: emailAddonsTable,
      total_payment: PHpeso.format(booking.receipt.total),
    });

    return true;
  } catch (err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
};

export const updateRefundInfo = async ({
  bookingRefundId,
  data,
}: {
  data: {
    refNo?: string | undefined;
    amount?: number | undefined;
    updatedBy: string;
    process: ProcessType;
  };
  bookingRefundId: string;
}) => {
  try {
    const refund = await BookingRefundRepository.findBookingRefundById(bookingRefundId);

    if (!refund) throw new TRPCError({ code: 'NOT_FOUND', message: 'Refund not found' });

    if (refund.status === 'SUCCESS') throw new TRPCError({ code: 'FORBIDDEN', message: 'This booking is already refunded!' });

    return BookingRefundRepository.updateBookinRefund(bookingRefundId, {
      referenceNo: data.refNo,
      process: data.process,
      updatedBy: data.updatedBy,
      amount: data.amount,
      status: 'SUCCESS',
    });
  } catch (err: any) {
    throw new TRPCError({ code: err.code || 'INTERNAL_SERVER_ERROR', message: err.message || 'Something went wrong. Try Again' });
  }
};
