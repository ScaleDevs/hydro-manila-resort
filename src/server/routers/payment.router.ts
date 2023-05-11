import { z } from 'zod';

import { procedure, router } from '../trpc';
import { PaymentService } from '@/svc/payment.service';

export const paymentRouter = router({
  initiatePaymentSessionForBooking: procedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        phoneNumber: z.string(),
        bookingDate: z.string(),
        guests: z.number(),
        roomId: z.string().nullable(),
        roomVersion: z.number(),
        productId: z.string(),
        productVersion: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { paymentIntentResource, bookingState } = await PaymentService.initiatePaymentSessionForBooking(input);

      return {
        paymentIntentResource,
        bookingState,
      };
    }),
  initiatePaymentSessionForUpdateBooking: procedure
    .input(
      z.object({
        bookingRefNo: z.string(),
        bookingUpdates: z.object({
          guests: z.number().optional(),
          bookingDate: z.string().optional(),
          productId: z.string().optional(),
          roomId: z.string().optional().nullable(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await PaymentService.initiatePaymentSessionForUpdateBooking(input.bookingRefNo, input.bookingUpdates);

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
      return PaymentService.attachPaymentMethodToIntent(input);
    }),
  createRefund: procedure
    .input(
      z.object({
        refNo: z.string(),
        reason: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return PaymentService.createRefund(input.refNo, input.reason);
    }),
  getPaymentIntentSession: procedure
    .input(
      z.object({
        paymentIntentId: z.string(),
      }),
    )
    .query(({ input }) => {
      return PaymentService.getPaymentIntentSession(input.paymentIntentId);
    }),
});
