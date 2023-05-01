import { z } from 'zod';
import { protectedProcedure, procedure, router } from '../trpc';
import { BookingService } from '@/svc/booking.service';
import { TRPCError } from '@trpc/server';
import { ProductRepository } from '@/server/repository/product.repo';
import { RoomRepository } from '@/server/repository/room.repo';

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

      const updateLog = await BookingService.buildBookingDetailsUpdateLog(bookingRecord, data);
      const result = await BookingService.updateBookingSchedule(bookingRecord, { bookingDate, ...data });

      return BookingService.updateBooking(input.bookingId, result.product, result.productDetails, {
        ...data,
        updateLog: result?.updateLog ? [...updateLog, ...result.updateLog] : [...updateLog],
        startSession: result?.startSession,
        endSession: result?.endSession,
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
          roomId: z.string().optional(),
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

      const product = input.bookingRequestUpdate.productId
        ? await ProductRepository.getProductDetails(input.bookingRequestUpdate.productId)
        : undefined;
      const room = input.bookingRequestUpdate.roomId
        ? await RoomRepository.getRoomDetails(input.bookingRequestUpdate.roomId)
        : undefined;

      const currentTotal = bookingRecord.receipt.total;
      const newTotal = await BookingService.getBookingDetailsTotal(input.bookingRequestUpdate, { product, room });

      // partial refund
      if (currentTotal > newTotal && input.customerInfo) {
        await BookingService.updateBookingPartialRefundCase(
          bookingRecord,
          input.bookingRequestUpdate,
          input.customerInfo,
          {
            product,
            room,
          },
          newTotal,
        );
      } else if (currentTotal < newTotal) {
        // create a payment intent for customer to pay the additional amount
      } else {
        // just update the details
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
});
