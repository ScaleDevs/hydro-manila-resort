import { z } from 'zod';
import { protectedProcedure, procedure, router } from '../trpc';
import { BookingSettingService } from '@/svc/bookingsetting.service';

export const bookingSettingRouter = router({
  upsertBookingSetting: protectedProcedure
    .input(
      z.object({
        bookingFee: z.number(),
        minPax: z.number(),
        maxPax: z.number(),
        extraHeadFee: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const bookingRecord = await BookingSettingService.findFirstBookingSetting();

      if (bookingRecord) {
        return BookingSettingService.updateBookingSettingById(bookingRecord.bookingSettingId, input);
      }

      return BookingSettingService.createBookingSetting(input);
    }),
  getBookingSetting: procedure.query(() => {
    return BookingSettingService.findFirstBookingSetting();
  }),
});
