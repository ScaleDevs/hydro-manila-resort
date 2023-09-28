import { z } from 'zod';
import { protectedProcedure, procedure, router } from '@/server/trpc';
import { BookingHandler } from '@/server/handlers/booking.handler';
import { BookingRepository } from '@/repo/booking.repo';
import { BookingRefundRepository } from '@/repo/bookingrefund.repo';

export const bookingRouter = router({
  getManyBooking: protectedProcedure
    .input(
      z.object({
        ref_no: z.string().optional(),
        dateFilter: z
          .object({
            startDate: z.string(),
            endDate: z.string(),
          })
          .optional(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(10),
      }),
    )
    .query(({ input }) => {
      return BookingRepository.findManyBooking(input);
    }),
  getBookingById: protectedProcedure.input(z.string()).query(({ input }) => {
    return BookingRepository.findBookingById(input);
  }),
  getBookingByRefNo: protectedProcedure.input(z.string().min(1)).query(({ input }) => {
    return BookingHandler.getBookingByRefNo(input);
  }),
  deleteBooking: protectedProcedure.input(z.string()).mutation(({ input }) => {
    return BookingRepository.deleteBooking(input);
  }),
  updateBooking: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        username: z.string().min(1),
        data: z.object({
          bookingDate: z.string().optional(),
          guests: z
            .object({
              overNightGuests: z.number(),
              nonOverNightGuests: z.number(),
            })
            .optional(),
          rooms: z.array(z.string()).optional(),
          productId: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return BookingHandler.updateBookingHandler(input.bookingId, input.username, input.data);
    }),
  customerUpdateRequest: procedure
    .input(
      z.object({
        bookingRefNo: z.string(),
        bookingRequestUpdate: z.object({
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
        customerInfo: z
          .object({
            bankType: z.string(),
            accountNo: z.string(),
            accountName: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return BookingHandler.customerUpdateRequestHandler(input);
    }),
  getAllBookingsByDates: procedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(({ input }) => {
      return BookingHandler.findAllBookingsByDates(input);
    }),
  getBookingByRefNoPublic: procedure.input(z.string().min(1)).mutation(async ({ input }) => {
    return BookingHandler.getBookingByRefNoPublic(input);
  }),
  checkBookingAvailability: procedure
    .input(
      z.object({
        bookingDate: z.string(),
        productId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return BookingHandler.checkBookingAvailability(input);
    }),
  addTransactionLog: procedure
    .input(
      z.object({
        bookingId: z.string().min(1),
        username: z.string().min(1),
        data: z.object({
          refNo: z.string(),
          process: z.enum(['BANK', 'CASH']),
          type: z.enum(['REFUND', 'PAYMENT']),
          amount: z.number().min(1, 'Required'),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return BookingHandler.addTransactionLog(input.bookingId, input.username, input.data);
    }),
  updateRefundInfo: procedure
    .input(
      z.object({
        bookingRefundId: z.string().min(1),
        data: z.object({
          refNo: z.string(),
          process: z.enum(['BANK', 'CASH']),
          updatedBy: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return BookingRefundRepository.updateBookinRefund(input.bookingRefundId, {
        referenceNo: input.data.refNo,
        process: input.data.process,
        updatedBy: input.data.updatedBy,
      });
    }),
  resendBookingInfo: procedure.input(z.string().min(1)).mutation(async ({ input }) => {
    return BookingHandler.resetBookingEmailConfirmation(input);
  }),
});
