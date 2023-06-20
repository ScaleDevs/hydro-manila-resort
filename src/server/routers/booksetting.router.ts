import { z } from 'zod';
import { protectedProcedure, procedure, router } from '@/server/trpc';
import { BookingSettingService } from '@/svc/bookingsetting.service';
import { BookingSettingRepository } from '@/repo/bookingsetting.repo';

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
      const bookingRecord = await BookingSettingRepository.findFirstBookingSetting();
      if (bookingRecord) return BookingSettingRepository.updateBookingSettingById(bookingRecord.bookingSettingId, input);
      return BookingSettingService.createBookingSetting(input);
    }),
  getBookingSetting: procedure.query(() => {
    return BookingSettingRepository.findFirstBookingSetting();
  }),
});
