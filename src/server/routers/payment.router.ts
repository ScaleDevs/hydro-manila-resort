import { z } from 'zod';
import dayjs from 'dayjs';
import { procedure, router } from '@/server/trpc';
import { PaymentHandler } from '@/server/handlers/payment.handler';
import { getPaymentIntentSession } from '@/repo/payment.repo';

export const paymentRouter = router({
  initiatePaymentSessionForBooking: procedure
    .input(
      z
        .object({
          name: z.string(),
          email: z.string().email(),
          phoneNumber: z.string(),
          bookingDate: z.string(),
          guests: z.object({
            overNightGuests: z.number(),
            nonOverNightGuests: z.number(),
          }),
          roomIds: z.array(z.string().min(1)),
          productId: z.string(),
          idS3Key: z.string(),
        })
        .refine(
          (data) => {
            // Only validate for VillaLeonora
            if (process.env.NEXT_PUBLIC_APP === 'VillaLeonora') {
              const bookingDate = dayjs(data.bookingDate);
              const maxDate = dayjs('2025-12-31');
              return !bookingDate.isAfter(maxDate, 'day');
            }
            return true;
          },
          {
            message: 'Booking dates after 2025 are not allowed for VillaLeonora',
            path: ['bookingDate'],
          },
        ),
    )
    .mutation(async ({ input }) => {
      const { paymentIntentResource, bookingState } = await PaymentHandler.initiatePaymentSessionForBooking(input);
      return {
        paymentIntentResource,
        bookingState,
      };
    }),
  initiatePaymentSessionForUpdateBooking: procedure
    .input(
      z
        .object({
          bookingRefNo: z.string(),
          bookingUpdates: z.object({
            guests: z
              .object({
                overNightGuests: z.number(),
                nonOverNightGuests: z.number(),
              })
              .optional(),
            bookingDate: z.string().optional(),
            productId: z.string().optional(),
            rooms: z.array(z.string().min(1)).optional(),
          }),
        })
        .refine(
          (data) => {
            // Only validate for VillaLeonora
            if (process.env.NEXT_PUBLIC_APP === 'VillaLeonora' && data.bookingUpdates.bookingDate) {
              const bookingDate = dayjs(data.bookingUpdates.bookingDate);
              const maxDate = dayjs('2025-12-31');
              return !bookingDate.isAfter(maxDate, 'day');
            }
            return true;
          },
          {
            message: 'Booking dates after 2025 are not allowed for VillaLeonora',
            path: ['bookingUpdates', 'bookingDate'],
          },
        ),
    )
    .mutation(async ({ input }) => {
      const result = await PaymentHandler.initiatePaymentSessionForUpdateBooking(input.bookingRefNo, input.bookingUpdates);
      return result;
    }),
  attachPaymentMethodToIntent: procedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        paymentMethodId: z.string(),
        clientKey: z.string(),
        returnUrl: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      return PaymentHandler.attachPaymentMethodToIntentHandler(input);
    }),
  createRefund: procedure
    .input(
      z.object({
        refNo: z.string(),
        reason: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return PaymentHandler.createRefundHandler(input.refNo, input.reason);
    }),
  getPaymentIntentSession: procedure
    .input(
      z.object({
        paymentIntentId: z.string(),
      }),
    )
    .query(({ input }) => {
      return getPaymentIntentSession(input.paymentIntentId);
    }),
});
