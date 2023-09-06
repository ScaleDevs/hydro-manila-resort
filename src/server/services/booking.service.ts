import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { BookingUpdateLog, Guests } from '@prisma/client';
import { calendar_v3 } from 'googleapis';

import {
  utcDateToTzDayInstance,
  tzSchedToDayJsInsance,
  buildGoogleCalendarDateTime,
  PHpeso,
  getExtraHeadsTotal,
  getProductPrice,
} from '@/utils/helper';
import { IBooking, IProduct, IRoom, CustomerUpdateBookingParams } from '@/utils/types';
import { BookingRepository } from '@/server/repository/booking.repo';
import { ProductRepository } from '@/server/repository/product.repo';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
import { RoomRepository } from '@/server/repository/room.repo';
import { BookingAttemptRepository } from '@/server/repository/bookingattempt.repo';
import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
import {
  notificationUpdateFailed,
  sendRefundEmailConflictBooking,
  updateBookingPartialRefundEmail,
} from '@/server/repository/mailersend.repo';
import { constants } from '../constants';
import { createGuestsSummary } from '../util';

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

  public async findBookingByReferenceNo(refNo: string) {
    try {
      return BookingRepository.findBookingByReferenceNo(refNo);
    } catch (err: any) {
      const code = err.code || 'INTERNAL_SERVER_ERROR';
      const message = err.message || 'Something went wrong';

      throw new TRPCError({ code, message });
    }
  }

  public async extendedBookingInstance(booking: IBooking) {
    try {
      const product = await ProductRepository.findProductById(booking.productId);
      const bookingResult: typeof booking & { product: IProduct & { includedRoomsName: string[] } } & { roomsObject: IRoom[] } = {
        ...booking,
        product: {
          ...product,
          includedRoomsName: [],
        },
        roomsObject: [],
      };

      if (booking.rooms.length > 0) {
        const rooms = await RoomRepository.findRoomsByIds(booking.rooms);
        bookingResult['roomsObject'] = rooms;
        bookingResult.product = {
          ...product,
          includedRoomsName: rooms.map((v) => v.roomIdentityName),
        };
      }

      return bookingResult;
    } catch (err: any) {
      const code = err.code || 'INTERNAL_SERVER_ERROR';
      const message = err.message || 'Something went wrong';

      throw new TRPCError({ code, message });
    }
  }

  public async buildBookingDetailsUpdateLog(
    bookingRecord: IBooking,
    data: {
      guests?: Guests;
      rooms?: string[];
      productId?: string;
    },
    updatedBy: 'ADMIN' | 'CUSTOMER',
    transactionRefNo?: string,
  ) {
    try {
      const entries = Object.entries(data);
      const updateLog: BookingUpdateLog[] = [];

      for (const entry of entries) {
        const fieldUpdated = entry[0] as keyof typeof data;

        if (fieldUpdated === 'guests')
          updateLog.push({
            transactionRefNo: transactionRefNo ? transactionRefNo : null,
            updatedBy,
            fieldUpdated,
            fromValue: createGuestsSummary({ guests: bookingRecord.guests }),
            toValue: createGuestsSummary({ guests: data.guests }),
            createdAt: dayjs().toDate(),
          });
        else
          updateLog.push({
            transactionRefNo: transactionRefNo ? transactionRefNo : null,
            updatedBy,
            fieldUpdated,
            fromValue: `${bookingRecord[fieldUpdated]}`,
            toValue: `${entry[1]}`,
            createdAt: dayjs().toDate(),
          });
      }

      return updateLog;
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - buildBookingDetailsUpdateLog' });
    }
  }

  public async buildScheduleAndUpdateLog({
    bookingRecord,
    updatedProductId,
    updatedBookedDate,
    updatedBy,
    paymentId,
    product,
  }: {
    bookingRecord: IBooking;
    updatedBookedDate?: string;
    updatedProductId?: string;
    updatedBy: 'ADMIN' | 'CUSTOMER';
    paymentId?: string;
    product: IProduct;
  }) {
    try {
      const updateLogs: BookingUpdateLog[] = [];
      const bookingDate = updatedBookedDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD');
      const startSession = tzSchedToDayJsInsance(bookingDate, product.scheduleStart);
      const endSession = tzSchedToDayJsInsance(
        dayjs(bookingDate)
          .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
          .format('YYYY-MM-DD'),
        product.scheduleEnd,
      );
      const startSessionISOString = startSession.toISOString();
      const endSessionISOString = endSession.toISOString();

      if (!updatedBookedDate && !updatedProductId)
        return { updateLogs, startSession, endSession, startSessionISOString, endSessionISOString };

      const isBookingDateTaken = await BookingRepository.findBookingConflicts({
        startDate: startSessionISOString,
        endDate: endSessionISOString,
        bookingId: bookingRecord.id,
      });

      const isEventSchedTaken = await ScheduledEventRepository.checkIfScheduleIsTaken({
        startDate: startSessionISOString,
        endDate: endSessionISOString,
      });

      if (isBookingDateTaken || isEventSchedTaken) {
        if (paymentId)
          await sendRefundEmailConflictBooking({
            recipientEmail: bookingRecord.email,
            customer_name: bookingRecord.name,
            payment_id: paymentId,
          });

        throw new TRPCError({ code: 'CONFLICT', message: 'Schedule is not available! Kindly choose another date' });
      }

      updateLogs.push({
        transactionRefNo: paymentId ? paymentId : null,
        updatedBy,
        fieldUpdated: 'startSession',
        fromValue: bookingRecord.startSession as string,
        toValue: startSessionISOString,
        createdAt: dayjs().toDate(),
      });

      updateLogs.push({
        transactionRefNo: paymentId ? paymentId : null,
        updatedBy,
        fieldUpdated: 'endSession',
        fromValue: bookingRecord.endSession as string,
        toValue: endSessionISOString,
        createdAt: dayjs().toDate(),
      });

      return { updateLogs, startSession, endSession, startSessionISOString, endSessionISOString };
    } catch (err: any) {
      throw new TRPCError({
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Something went wrong - buildScheduleAndUpdateLog',
      });
    }
  }

  public async updateBooking({
    bookingId,
    product,
    rooms,
    data,
    paymentId,
  }: {
    bookingId: string;
    product: IProduct;
    rooms: string[];
    data: Partial<IBooking>;
    paymentId?: string;
  }) {
    try {
      const updatedBooking = await BookingRepository.updateBooking(bookingId, { ...data });

      const googleCalendarUpdates: calendar_v3.Schema$Event = {
        summary: updatedBooking.name,
        description: `${product.name} / ${updatedBooking.guests.nonOverNightGuests ?? 0} Non-Overnight PAX /  ${
          updatedBooking.guests.overNightGuests ?? 0
        } Overnight PAX / ${product.isAllRooms ? 'Whole Place' : rooms.length > 0 ? rooms.join(', ') : 'No Rooms'}`,
      };

      if (!!data.startSession && !!data.endSession) {
        googleCalendarUpdates['start'] = {
          dateTime: buildGoogleCalendarDateTime(data.startSession),
          timeZone: constants.general.timezone,
        };

        googleCalendarUpdates['end'] = {
          dateTime: buildGoogleCalendarDateTime(data.endSession),
          timeZone: constants.general.timezone,
        };
      }

      if (updatedBooking.calendarEventId)
        await GoogleCalendarRepository.updateEvent(updatedBooking.calendarEventId, googleCalendarUpdates);

      return updatedBooking;
    } catch (err) {
      const bookingRecord = await BookingRepository.findBookingById(bookingId);
      await notificationUpdateFailed({
        customer_name: bookingRecord.name,
        customer_email: bookingRecord.email,
        payment_id: paymentId,
        ref_no: bookingRecord.ref_no,
      });
      if (!!paymentId) return;
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - updateBooking' });
    }
  }

  public async getBookingDetailsTotal({
    bookedDate,
    product,
    rooms,
    guests,
  }: {
    bookedDate: string;
    guests: Guests;
    product: IProduct;
    rooms: IRoom[];
  }) {
    try {
      let newTotal = 0;
      let additionalHeadsPrice = 0;
      let roomPrice = 0;
      const productPrice = getProductPrice(bookedDate, product);

      newTotal += productPrice;
      if (!!guests) {
        const { guestSetting } = product;
        const extraOverNightPaxTotal = getExtraHeadsTotal(
          guests.overNightGuests,
          guestSetting.minOverNightGuestPax,
          guestSetting.overNightGuestFee,
        );
        const extraNonOverNightPaxTotal = getExtraHeadsTotal(
          guests.nonOverNightGuests,
          guestSetting.minNonOverNightGuestPax,
          guestSetting.nonOverNightGuestFee,
        );
        newTotal += extraNonOverNightPaxTotal + extraOverNightPaxTotal;
        additionalHeadsPrice = extraNonOverNightPaxTotal + extraOverNightPaxTotal;
      }
      rooms.forEach((recordInfo) => {
        if (product.includedRooms.some((roomId) => roomId === recordInfo.roomId)) return;
        roomPrice += recordInfo.price;
        newTotal += recordInfo.price;
      });

      return {
        productPrice,
        roomPrice,
        additionalHeadsPrice,
        bookingFee: 0,
        total: newTotal,
      };
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - getBookingDetailsTotal' });
    }
  }

  public async updateBookingPartialRefundCase({
    bookingRecord,
    bookingRequestUpdate,
    customerInfo,
    newTotal,
    oldProduct,
    oldRooms,
    newProduct,
    newRooms,
  }: {
    bookingRecord: IBooking;
    bookingRequestUpdate: CustomerUpdateBookingParams;
    customerInfo: {
      bankType: string;
      accountNo: string;
      accountName: string;
    };
    oldProduct: IProduct;
    newProduct?: IProduct;
    oldRooms?: string[];
    newRooms?: string[];
    newTotal: number;
  }) {
    try {
      const modifications: { name: string; value: string }[] = [];

      if (!!bookingRequestUpdate.guests)
        modifications.push({
          name: 'No. of Guests',
          value: createGuestsSummary({ guests: bookingRequestUpdate.guests }),
        });

      if (!!newRooms)
        modifications.push({
          name: 'Rooms',
          value: newProduct?.isAllRooms ? 'Whole Place' : !!newRooms.length ? newRooms.join(', ') : 'None',
        });

      if (!!newProduct || bookingRequestUpdate.bookingDate) {
        const product = newProduct || oldProduct;
        const bookingDate =
          bookingRequestUpdate.bookingDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD');

        modifications.push({
          name: 'Type of Booking',
          value: newProduct?.name || oldProduct.name,
        });

        modifications.push({
          name: 'Check-In Date',
          value: tzSchedToDayJsInsance(bookingDate as string, newProduct?.scheduleStart || oldProduct.scheduleStart).format(
            'MMM DD, YYYY / hh:mm A',
          ),
        });

        modifications.push({
          name: 'Check-Out Date',
          value: tzSchedToDayJsInsance(
            dayjs(bookingDate)
              .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
              .format('YYYY-MM-DD'),
            newProduct?.scheduleEnd || oldProduct.scheduleEnd,
          ).format('MMM DD, YYYY / hh:mm A'),
        });
      }

      // send email to both support team & customer
      await updateBookingPartialRefundEmail(bookingRecord, PHpeso.format(bookingRecord.receipt.total - newTotal), {
        reference_no: bookingRecord.ref_no,
        guests: createGuestsSummary({ isAllRooms: (newProduct || oldProduct).isAllRooms, guests: bookingRecord.guests }),
        booking_type: oldProduct.name,
        room: oldProduct.isAllRooms ? 'Whole Place' : !!oldRooms?.length ? oldRooms.join(', ') : 'None',
        check_in_date: dayjs.utc(bookingRecord.startSession).tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
        check_out_date: dayjs.utc(bookingRecord.endSession).tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
        modification: modifications,
        transaction: [
          {
            name: 'Bank',
            value: customerInfo.bankType,
          },
          {
            name: 'Account No',
            value: customerInfo.accountNo,
          },
          {
            name: 'Account Name',
            value: customerInfo.accountName,
          },
          {
            name: 'Total Refund Amount',
            value: PHpeso.format(bookingRecord.receipt.total - newTotal),
          },
        ],
      });

      return true;
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - updateBookingPartialRefundCase()' });
    }
  }
}

export const BookingService = new Service();
