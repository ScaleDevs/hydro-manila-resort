import { z } from 'zod';
import { protectedProcedure, procedure, router } from '../trpc';
import { BookingService } from '@/svc/booking.service';

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
  rescheduleBooking: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        data: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return BookingService.rescheduleBooking(input.bookingId, input.data);
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
