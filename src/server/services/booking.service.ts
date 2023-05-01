import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { BookingUpdateLog, ProductDetails, RoomDetails } from '@prisma/client';
import { calendar_v3 } from 'googleapis';

import { utcDateToTzDayInstance, tzSchedToDayJsInsance, buildGoogleCalendarDateTime, PHpeso } from '@/utils/helper';
import { IBooking, IProduct, IRoom } from '@/utils/types';
import { IFindManyBookingInput, BookingRepository, IBookingDates } from '@/server/repository/booking.repo';
import { ProductRepository } from '@/server/repository/product.repo';
import { ScheduledEventRepository } from '@/server/repository/scheduledevent.repo';
import { RoomRepository } from '@/server/repository/room.repo';
import { BookingAttemptRepository } from '@/server/repository/bookingattempt.repo';
import { GoogleCalendarRepository } from '@/server/repository/googlecalender.repo';
import { BookingSettingRepository } from '@/server/repository/bookingsetting.repo';
import { updateBookingPartialRefundEmail } from '@/server/repository/mailersend.repo';
import { constants } from '../constants';

type CustomerUpdateBookingParams = {
  guests?: number;
  bookingDate?: string | Date;
  productId?: string;
  roomId?: string;
};

type ProductRoomDetails = {
  product?: {
    product: IProduct;
    productDetails: ProductDetails;
  };
  room?: {
    room: IRoom;
    roomDetails: RoomDetails;
  };
};

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

      if (!booking) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No Booking Record Found' });

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
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
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
  ) {
    try {
      const entries = Object.entries(data);
      const updateLog: BookingUpdateLog[] = [];

      for (const entry of entries) {
        const fieldUpdated = entry[0] as keyof typeof data;

        updateLog.push({
          updatedBy: 'ADMIN',
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

  public async updateBookingSchedule(
    bookingRecord: IBooking,
    data: {
      bookingDate?: string | undefined;
      productId?: string | undefined;
    },
  ) {
    try {
      const { productDetails, product } = await ProductRepository.getProductDetails(data.productId || bookingRecord.productId);

      const updateLog: BookingUpdateLog[] = [];
      const bookingDate = data.bookingDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD');

      const endDate = dayjs(bookingDate)
        .add(!!productDetails.scheduleEndNextDay ? 1 : 0, 'day')
        .format('YYYY-MM-DD');

      const startSession = tzSchedToDayJsInsance(bookingDate, productDetails.scheduleStart).toISOString();
      const endSession = tzSchedToDayJsInsance(endDate, productDetails.scheduleEnd).toISOString();

      if (!data.bookingDate && !data.productId) return { updateLog, startSession, endSession, product, productDetails };

      updateLog.push({
        updatedBy: 'ADMIN',
        fieldUpdated: 'startSession',
        fromValue: `${bookingRecord.startSession}`,
        toValue: startSession,
        createdAt: dayjs().toDate(),
      });

      updateLog.push({
        updatedBy: 'ADMIN',
        fieldUpdated: 'endSession',
        fromValue: `${bookingRecord.endSession}`,
        toValue: endSession,
        createdAt: dayjs().toDate(),
      });

      return { updateLog, startSession, endSession, product, productDetails };
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - updateBookingSchedule' });
    }
  }

  public async updateBooking(bookingId: string, product: IProduct, productDetails: ProductDetails, data: Partial<IBooking>) {
    try {
      let chosenRoom: IRoom | null = null;

      if (data.roomId) {
        chosenRoom = await RoomRepository.findRoomById(data.roomId);
        if (!chosenRoom) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found!' });
      }

      const updatedBooking = await BookingRepository.updateBooking(bookingId, { ...data });

      const googleCalendarUpdates: calendar_v3.Schema$Event = {
        summary: updatedBooking.name,
        description: `${product?.name} / ${updatedBooking.guests ?? 0} PAX / ${
          chosenRoom?.roomIdentityName ?? (!!productDetails?.withRooms ? 'ALL ROOMS' : 'NO ROOM')
        }`,
      };

      if (!!data.startSession && !!data.endSession) {
        console.log(buildGoogleCalendarDateTime(data.startSession));
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
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - updateBooking' });
    }
  }

  public async getBookingDetailsTotal(
    bookingRequestUpdate: CustomerUpdateBookingParams,
    newProductRoomDetails: ProductRoomDetails,
  ) {
    try {
      let newTotal = 0;
      const { product, room } = newProductRoomDetails;

      if (!!bookingRequestUpdate.guests) {
        const bookingSettings = await BookingSettingRepository.findFirstBookingSetting();
        if (!bookingSettings) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Booking Settings Not Found' });
        if (bookingRequestUpdate.guests > bookingSettings.minPax)
          newTotal = (bookingRequestUpdate.guests - bookingSettings.minPax) * bookingSettings.extraHeadFee;
      }
      if (!!bookingRequestUpdate.productId && product) newTotal += product.productDetails.price;
      if (!!bookingRequestUpdate.roomId && room) newTotal += room.roomDetails.price;

      return newTotal;
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - getBookingDetailsTotal' });
    }
  }

  public async updateBookingPartialRefundCase(
    bookingRecord: IBooking,
    bookingRequestUpdate: CustomerUpdateBookingParams,
    customerInfo: {
      bankType: string;
      accountNo: string;
      accountName: string;
    },
    newProductRoomDetails: ProductRoomDetails,
    newTotal: number,
  ) {
    try {
      const { product: newProduct, room: newRoom } = newProductRoomDetails;

      let currentRoom = 'None';
      const { product: currentProduct, productDetails: currentProductDetails } = await ProductRepository.getProductDetails(
        bookingRecord.productId,
      );
      const modifications: { name: string; value: string }[] = [];

      if (currentProductDetails.withRooms) currentRoom = 'ALL ROOMS';
      else if (bookingRecord.roomId) {
        const result = await RoomRepository.getRoomDetails(bookingRecord.roomId);
        currentRoom = result.room.roomIdentityName;
      }

      if (!!bookingRequestUpdate.guests)
        modifications.push({
          name: 'No. of Guests',
          value: `${bookingRequestUpdate.guests}`,
        });

      if (!!bookingRequestUpdate.roomId && newRoom)
        modifications.push({
          name: 'Rooms',
          value: newRoom.room.roomIdentityName,
        });

      if ((!!bookingRequestUpdate.productId && newProduct) || bookingRequestUpdate.bookingDate) {
        const bookingDate =
          bookingRequestUpdate.bookingDate || utcDateToTzDayInstance(bookingRecord.startSession).format('YYYY-MM-DD');
        const endDate = dayjs(bookingDate)
          .add(!!newProduct?.productDetails.scheduleEndNextDay || currentProductDetails.scheduleEndNextDay ? 1 : 0, 'day')
          .format('YYYY-MM-DD');

        modifications.push({
          name: 'Type of Booking',
          value: newProduct?.product.name || currentProduct.name,
        });

        modifications.push({
          name: 'Check-In Date',
          value: tzSchedToDayJsInsance(
            bookingDate as string,
            newProduct?.productDetails.scheduleStart || currentProductDetails.scheduleStart,
          ).format('MMM DD, YYYY / hh:mm A'),
        });

        modifications.push({
          name: 'Check-Out Date',
          value: tzSchedToDayJsInsance(
            endDate,
            newProduct?.productDetails.scheduleEnd || currentProductDetails.scheduleEnd,
          ).format('MMM DD, YYYY / hh:mm A'),
        });
      }

      // send email to both hydro team & customer
      await updateBookingPartialRefundEmail(bookingRecord, PHpeso.format(bookingRecord.receipt.total - newTotal), {
        reference_no: bookingRecord.ref_no,
        guests: `${bookingRecord.guests}`,
        booking_type: currentProduct.name,
        room: currentRoom,
        check_in_date: dayjs.utc(bookingRecord.startSession).tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
        check_out_date: dayjs.utc(bookingRecord.endSession).tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
        modification: modifications,
        transaction: [
          {
            name: 'Total Refund Amount',
            value: PHpeso.format(bookingRecord.receipt.total - newTotal),
          },
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
        ],
      });

      return true;
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong - updateBookingPartialRefundCase' });
    }
  }
}

export const BookingService = new Service();
