import { z } from 'zod';
import { procedure, router } from '../trpc';
import { BookingService } from '@/svc/booking.service';

export const bookingRouter = router({
  create: procedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        phoneNumber: z.string(),
        startSession: z.date(),
        endSession: z.date(),
        guests: z.number(),
        productExtraId: z.string(),
        productExtraVersion: z.number(),
        productId: z.string(),
        productVersion: z.number(),
        receipt: z.object({
          productPrice: z.number(),
          roomPrice: z.number(),
          additionalHeadsPrice: z.number(),
          total: z.number(),
        }),
      }),
    )
    .mutation(({ input }) => {
      return BookingService.createBooking(input);
    }),
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
