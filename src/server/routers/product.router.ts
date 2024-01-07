import { z } from 'zod';
import { procedure, protectedProcedure, router } from '@/server/trpc';
import { ProductHandler } from '@/server/handlers/product.handler';
import { ProductRepository } from '@/repo/product.repo';

export const productRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        price: z.number(),
        scheduleStartHour: z.number().max(12),
        scheduleStartMin: z.number().max(59),
        scheduleStartPost: z.enum(['AM', 'PM']),
        scheduleEndHour: z.number().max(12),
        scheduleEndMin: z.number().max(59),
        scheduleEndPost: z.enum(['AM', 'PM']),
        scheduleEndNextDay: z.boolean(),
        includedRooms: z.array(z.string().min(1)),
        description: z.string().optional(),
        guestSetting: z.object({
          nonOverNightGuestFee: z.number(),
          minNonOverNightGuestPax: z.number(),
          maxNonOverNightGuestPax: z.number(),
          overNightGuestFee: z.number(),
          minOverNightGuestPax: z.number(),
          maxOverNightGuestPax: z.number(),
        }),
        isAllRooms: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      return ProductHandler.createProductHandler({ ...input });
    }),
  updateProduct: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        details: z.object({
          name: z.string().optional(),
          price: z.number().optional(),
          schedStartParams: z
            .object({
              scheduleHour: z.number().max(12),
              scheduleMin: z.number().max(59),
              schedulePost: z.enum(['AM', 'PM']),
            })
            .optional(),
          schedEndParams: z
            .object({
              scheduleHour: z.number().max(12),
              scheduleMin: z.number().max(59),
              schedulePost: z.enum(['AM', 'PM']),
            })
            .optional(),
          scheduleEndNextDay: z.boolean().optional(),
          withRooms: z.boolean().optional(),
          description: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return ProductHandler.updateProductHandler(input.id, input.details);
    }),
  deleteProduct: protectedProcedure.input(z.string()).mutation(({ input }) => {
    return ProductRepository.deleteProduct(input);
  }),
  getProductById: procedure.input(z.string().min(1)).query(({ input }) => {
    return ProductRepository.findProductById(input);
  }),
  getProducts: procedure
    .input(
      z.object({
        name: z.string().optional(),
        page: z.number(),
        limit: z.number(),
      }),
    )
    .query(({ input }) => {
      return ProductHandler.getProductsHandler(input);
    }),
});
