import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { BookingUpdateLog } from '@prisma/client';
import { calendar_v3 } from 'googleapis';

import { utcDateToTzDayInstance, tzSchedToDayJsInsance, buildGoogleCalendarDateTime, PHpeso } from '@/utils/helper';
import { IBooking, IProduct, IRoom, CustomerUpdateBookingParams } from '@/utils/types';
import { IFindManyBookingInput, BookingRepository, IBookingDates } from '@/server/repository/booking.repo';
import { ProductRepository } from '@/server/repository/product.repo';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
import { RoomRepository } from '@/server/repository/room.repo';
import { BookingAttemptRepository } from '@/server/repository/bookingattempt.repo';
import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
import { BookingSettingRepository } from '@/server/repository/bookingsetting.repo';
import {
  notificationUpdateFailed,
  sendRefundEmailConflictBooking,
  updateBookingPartialRefundEmail,
} from '@/server/repository/mailersend.repo';
import { constants } from '../constants';

class Service {
  public async createBooking(data: Omit<IBooking, 'id' | 'createdAt'>) {
    try {
      return BookingRepository.createBooking({
        ...data,
      });
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findBookingById(id: string) {
    try {
      return BookingRepository.findBookingById(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findBookingByReferenceNo(refNo: string) {
    try {
      const booking = await BookingRepository.findBookingByReferenceNo(refNo);

      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'No Booking Record Found' });

      const product = await ProductRepository.findProductById(booking.productId);

      if (!product) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No Product Record Found' });

      const bookingResult: typeof booking & { product: IProduct } & { room?: IRoom } = {
        ...booking,
        product,
      };

      if (booking.roomId) {
        const room = await RoomRepository.findRoomById(booking.roomId);
        bookingResult['room'] = room || undefined;
      }

      return bookingResult;
    } catch (err: any) {
      const code = err.code || 'INTERNAL_SERVER_ERROR';
      const message = err.message || 'Something went wrong';

      throw new TRPCError({ code, message });
    }
  }

  public async findBookingByPaymentIntentId(paymentIntentId: string) {
    try {
      return BookingRepository.findBookingByPaymentIntentId(paymentIntentId);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findManyBooking(inputs: IFindManyBookingInput) {
    try {
      return BookingRepository.findManyBooking(inputs);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findAllBookingsByDates(inputs: { startDate: string; endDate: string }) {
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

  public async deleteBooking(id: string) {
    try {
      return BookingRepository.deleteBooking(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async buildBookingDetailsUpdateLog(
    bookingRecord: IBooking,
    data: {
      guests?: number | undefined;
      roomId?: string | null | undefined;
      productId?: string | undefined;
    },
    updatedBy: 'ADMIN' | 'CUSTOMER',
    transactionRefNo?: string,
  ) {
    try {
      const entries = Object.entries(data);
      const updateLog: BookingUpdateLog[] = [];

      for (const entry of entries) {
        const fieldUpdated = entry[0] as keyof typeof data;

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
      const bookingDate = updatedBookedDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD');
      const endDate = dayjs(bookingDate)
        .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
        .format('YYYY-MM-DD');

      const startSession = tzSchedToDayJsInsance(bookingDate, product.scheduleStart).toISOString();
      const endSession = tzSchedToDayJsInsance(endDate, product.scheduleEnd).toISOString();

      if (!updatedBookedDate && !updatedProductId) return { updateLogs: [], startSession, endSession };

      const isBookingDateTaken = await BookingRepository.findBookingConflicts({
        startDate: startSession,
        endDate: endSession,
      });

      const isEventSchedTaken = await ScheduledEventRepository.checkIfScheduleIsTaken({
        startDate: startSession,
        endDate: endSession,
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

      const updateLogs: BookingUpdateLog[] = [];
      updateLogs.push({
        transactionRefNo: paymentId ? paymentId : null,
        updatedBy,
        fieldUpdated: 'startSession',
        fromValue: `${bookingRecord.startSession}`,
        toValue: startSession,
        createdAt: dayjs().toDate(),
      });

      updateLogs.push({
        transactionRefNo: paymentId ? paymentId : null,
        updatedBy,
        fieldUpdated: 'endSession',
        fromValue: `${bookingRecord.endSession}`,
        toValue: endSession,
        createdAt: dayjs().toDate(),
      });

      return { updateLogs, startSession, endSession };
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
    room,
    data,
    paymentId,
  }: {
    bookingId: string;
    product: IProduct;
    room?: IRoom;
    data: Partial<IBooking>;
    paymentId?: string;
  }) {
    try {
      const updatedBooking = await BookingRepository.updateBooking(bookingId, { ...data });

      const googleCalendarUpdates: calendar_v3.Schema$Event = {
        summary: updatedBooking.name,
        description: `${product.name} / ${updatedBooking.guests ?? 0} PAX / ${
          room?.roomIdentityName ?? (!!product.withRooms ? 'ALL ROOMS' : 'NO ROOM')
        }`,
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

  public async getBookingDetailsTotal({ product, room, guests }: { guests: number; product: IProduct; room?: IRoom }) {
    try {
      let newTotal = 0;
      let additionalHeadsPrice = 0;

      if (!!guests) {
        const bookingSettings = await BookingSettingRepository.findFirstBookingSetting();
        if (!bookingSettings) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Booking Settings Not Found' });
        if (guests > bookingSettings.minPax) {
          newTotal = (guests - bookingSettings.minPax) * bookingSettings.extraHeadFee;
          additionalHeadsPrice = (guests - bookingSettings.minPax) * bookingSettings.extraHeadFee;
        }
      }
      if (product) newTotal += product.price;
      if (room) newTotal += room.price;

      return {
        productPrice: product.price || 0,
        roomPrice: room?.price || 0,
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
    oldRoom,
    newProduct,
    newRoom,
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
    oldRoom?: IRoom | null;
    newRoom?: IRoom | null;
    newTotal: number;
  }) {
    try {
      let currentRoom = oldRoom?.roomIdentityName || 'None';
      const modifications: { name: string; value: string }[] = [];

      if (oldProduct.withRooms) currentRoom = 'ALL ROOMS';

      if (!!bookingRequestUpdate.guests)
        modifications.push({
          name: 'No. of Guests',
          value: `${bookingRequestUpdate.guests}`,
        });

      if (!!newRoom)
        modifications.push({
          name: 'Rooms',
          value: newRoom.roomIdentityName,
        });

      if (!!newProduct || bookingRequestUpdate.bookingDate) {
        const product = newProduct || oldProduct;
        const bookingDate =
          bookingRequestUpdate.bookingDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD');
        const endDate = dayjs(bookingDate)
          .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
          .format('YYYY-MM-DD');

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
          value: tzSchedToDayJsInsance(endDate, newProduct?.scheduleEnd || oldProduct.scheduleEnd).format(
            'MMM DD, YYYY / hh:mm A',
          ),
        });
      }

      // send email to both hydro team & customer
      await updateBookingPartialRefundEmail(bookingRecord, PHpeso.format(bookingRecord.receipt.total - newTotal), {
        reference_no: bookingRecord.ref_no,
        guests: `${bookingRecord.guests}`,
        booking_type: oldProduct.name,
        room: currentRoom,
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
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - updateBookingPartialRefundCase' });
    }
  }
}

export const BookingService = new Service();
