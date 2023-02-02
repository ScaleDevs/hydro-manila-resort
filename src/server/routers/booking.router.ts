import { z } from 'zod';
import { procedure, router } from '../trpc';
import { BookingService } from '@/svc/booking.service';

export const bookingRouter = router({
  getManyBooking: procedure
    .input(
      z.object({
        name: z.string().min(3).optional(),
        email: z.string().min(3).optional(),
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
  deleteBooking: procedure.input(z.string()).mutation(({ input }) => {
    return BookingService.deleteBooking(input);
  }),
});
