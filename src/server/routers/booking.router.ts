import { z } from 'zod';
import { procedure, router } from '../trpc';
import { BookingService } from '@/svc/booking.service';

export const bookingRouter = router({
  getManyBooking: procedure
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
  getBookingById: procedure.input(z.string()).query(({ input }) => {
    return BookingService.findBookingById(input);
  }),
  getBookingByRefNo: procedure.input(z.string()).query(({ input }) => {
    return BookingService.findBookingByReferenceNo(input);
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
  deleteBooking: procedure.input(z.string()).mutation(({ input }) => {
    return BookingService.deleteBooking(input);
  }),
});
