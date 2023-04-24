import { z } from 'zod';
import { protectedProcedure, procedure, router } from '../trpc';
import { BookingService } from '@/svc/booking.service';
import { TRPCError } from '@trpc/server';

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
          roomVersion: z.number().optional(),
          productId: z.string().optional(),
          productVersion: z.number().optional(),
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
