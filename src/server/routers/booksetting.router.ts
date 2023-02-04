import { z } from 'zod';
import { procedure, router } from '../trpc';
import { BookingSettingService } from '@/svc/bookingsetting.service';

export const bookingSettingRouter = router({
  createBookingSetting: procedure
    .input(
      z.object({
        bookingFee: z.number(),
        minPax: z.number(),
        maxPax: z.number(),
      }),
    )
    .mutation(({ input }) => {
      return BookingSettingService.createBookingSetting(input);
    }),
  getBookingSetting: procedure.query(() => {
    return BookingSettingService.findFirstBookingSetting();
  }),
  updateBookingSetting: procedure
    .input(
      z.object({
        bookingSettingId: z.string(),
        partialData: z.object({
          bookingFee: z.number().optional(),
          minPax: z.number().optional(),
          maxPax: z.number().optional(),
        }),
      }),
    )
    .mutation(({ input }) => {
      return BookingSettingService.updateBookingSettingById(input.bookingSettingId, input.partialData);
    }),
});
