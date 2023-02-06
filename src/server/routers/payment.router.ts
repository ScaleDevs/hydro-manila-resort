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
        startSession: z.string(),
        endSession: z.string(),
        guests: z.number(),
        roomId: z.string().nullable(),
        roomVersion: z.number(),
        productId: z.string(),
        productVersion: z.number(),
        receipt: z.object({
          productPrice: z.number(),
          roomPrice: z.number(),
          additionalHeadsPrice: z.number(),
          total: z.number(),
          bookingFee: z.number(),
        }),
      }),
    )
    .mutation(({ input }) => {
      return PaymentService.initiatePaymentSessionForBooking({
        ...input,
        startSession: new Date(input.startSession),
        endSession: new Date(input.endSession),
      });
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
