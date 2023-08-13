import { z } from 'zod';
import { protectedProcedure, procedure, router } from '@/server/trpc';
import { BookingSettingService } from '@/svc/bookingsetting.service';
import { BookingSettingRepository } from '@/repo/bookingsetting.repo';

export const bookingSettingRouter = router({
  upsertBookingSetting: protectedProcedure
    .input(
      z.object({
        bookingFee: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const checkBookingSetting = await BookingSettingRepository.checkBookingSetting();
      if (checkBookingSetting)
        return BookingSettingRepository.updateBookingSettingById(checkBookingSetting.bookingSettingId, input);
      return BookingSettingService.createBookingSetting(input);
    }),
  getBookingSetting: procedure.query(() => {
    return BookingSettingRepository.findFirstBookingSetting();
  }),
});
