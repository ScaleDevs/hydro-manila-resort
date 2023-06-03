import { z } from 'zod';
import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';

import { protectedProcedure, procedure, router } from '../trpc';
import { BookingService } from '@/svc/booking.service';
import { tzSchedToDayJsInsance } from '@/utils/helper';
import { ProductRepository } from '@/server/repository/product.repo';
import { RoomRepository } from '@/server/repository/room.repo';
import { GlobalService } from '@/server/services/global.service';
import { bookingDateChangeConfirmation } from '@/server/repository/mailersend.repo';
import { constants } from '../constants';

export const bookingRouter = router({
  getManyBooking: protectedProcedure
    .input(
      z.object({
        ref_no: z.string().optional(),
        dateFilter: z
          .object({
            startDate: z.string(),
            endDate: z.string(),
          })
          .optional(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(10),
      }),
    )
    .query(({ input }) => {
      return BookingService.findManyBooking(input);
    }),
  getBookingById: protectedProcedure.input(z.string()).query(({ input }) => {
    return BookingService.findBookingById(input);
  }),
  getBookingByRefNo: protectedProcedure.input(z.string()).query(({ input }) => {
    return BookingService.findBookingByReferenceNo(input);
  }),
  getBookingByRefNoPublic: procedure.input(z.string()).query(async ({ input }) => {
    const bookingInfo = await BookingService.findBookingByReferenceNo(input);

    return {
      guests: bookingInfo.guests,
      startSession: bookingInfo.startSession,
      endSession: bookingInfo.endSession,
      productId: bookingInfo.productId,
      roomId: bookingInfo.roomId,
      currentTotal: bookingInfo.receipt.total,
    };
  }),
  deleteBooking: protectedProcedure.input(z.string()).mutation(({ input }) => {
    return BookingService.deleteBooking(input);
  }),
  updateBooking: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        data: z.object({
          bookingDate: z.string().optional(),
          guests: z.number().optional(),
          roomId: z.string().nullable().optional(),
          productId: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const bookingRecord = await BookingService.findBookingById(input.bookingId);
      if (!bookingRecord) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking Record Not Found!' });

      const { bookingDate, ...data } = input.data;
      const roomId = data.roomId || bookingRecord.roomId;
      const product = await ProductRepository.findProductById(data.productId || bookingRecord.productId);
      const room = roomId ? await RoomRepository.findRoomById(roomId) : undefined;

      const updateLogs = await BookingService.buildBookingDetailsUpdateLog(bookingRecord, data, 'ADMIN');
      const result = await BookingService.buildScheduleAndUpdateLog({
        bookingRecord,
        updatedBookedDate: bookingDate,
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
    }),
  customerUpdateRequest: procedure
    .input(
      z.object({
        bookingRefNo: z.string(),
        bookingRequestUpdate: z.object({
          guests: z.number().optional(),
          bookingDate: z.string().optional(),
          productId: z.string().optional(),
          roomId: z.string().optional().nullable(),
        }),
        customerInfo: z
          .object({
            bankType: z.string(),
            accountNo: z.string(),
            accountName: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const bookingRecord = await BookingService.findBookingByReferenceNo(input.bookingRefNo);
      if (!bookingRecord) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking Record Not Found!' });

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
    }),
  getAllBookingsByDates: procedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(({ input }) => {
      return BookingService.findAllBookingsByDates(input);
    }),
  checkBookingAvailability: procedure
    .input(
      z.object({
        bookingDate: z.string(),
        productId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const product = await ProductRepository.findProductById(input.productId);
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product Not Found!' });

      const endDate = dayjs(input.bookingDate)
        .add(!!product.scheduleEndNextDay ? 1 : 0, 'day')
        .format('YYYY-MM-DD');

      const startSession = tzSchedToDayJsInsance(input.bookingDate, product.scheduleStart).toISOString();
      const endSession = tzSchedToDayJsInsance(endDate, product.scheduleEnd).toISOString();

      return GlobalService.checkScheduleAvailability({
        startDate: startSession,
        endDate: endSession,
      });
    }),
});
