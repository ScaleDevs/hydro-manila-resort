import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import dayjs from 'dayjs';

import { procedure, router } from '../trpc';
import { tzSchedToDate } from '../util';
import { PaymentService } from '@/svc/payment.service';
import { ProductService } from '@/svc/product.service';
import { RoomService } from '@/svc/room.service';
import { BookingSettingService } from '@/svc/bookingsetting.service';

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
      const product = await ProductService.findProductById(input.productId);
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found!' });
      const productDetails = product.details[input.productVersion];

      let room, roomDetails;
      if (input.roomId) {
        room = await RoomService.findRoomById(input.roomId);
        if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found!' });
        roomDetails = room.details[input.roomVersion];
      }

      const bookingSetting = await BookingSettingService.findFirstBookingSetting();
      if (!bookingSetting)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong, Kindly Try Again.' });

      const endDate = dayjs(input.bookingDate)
        .add(!!productDetails.scheduleEndNextDay ? 1 : 0, 'day')
        .format('YYYY-MM-DD');

      let total = 0;
      total += productDetails.price;
      if (roomDetails) total += roomDetails?.price;
      if (input.guests && input.guests > bookingSetting.minPax)
        total += (input.guests - bookingSetting.minPax) * bookingSetting.extraHeadFee;

      const bookingParam = {
        name: input.name,
        email: input.email,
        phoneNumber: input.phoneNumber,
        guests: input.guests,
        roomId: input.roomId,
        roomVersion: input.roomVersion,
        productId: input.productId,
        productVersion: input.productVersion,
        startSession: tzSchedToDate(input.bookingDate, productDetails.scheduleStart).toISOString(),
        endSession: tzSchedToDate(endDate, productDetails.scheduleEnd).toISOString(),
        receipt: {
          productPrice: productDetails.price,
          roomPrice: roomDetails?.price || 0,
          additionalHeadsPrice:
            input.guests && input.guests > bookingSetting.minPax
              ? (input.guests - bookingSetting.minPax) * bookingSetting.extraHeadFee
              : 0,
          bookingFee: 0,
          total,
        },
      };

      const paymentIntentResource = await PaymentService.initiatePaymentSessionForBooking(bookingParam);

      return {
        paymentIntentResource,
        bookingState: bookingParam,
      };
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
