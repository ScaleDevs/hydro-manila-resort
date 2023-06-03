import { z } from 'zod';
import { procedure, protectedProcedure, router } from '../trpc';
import { ProductService } from '@/svc/product.service';
import { IProduct } from '@/utils/types';
import { updateProductHandler } from '@/server/handlers/product.handler';

export const productRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        details: z.object({
          price: z.number(),
          scheduleStartHour: z.number().max(12),
          scheduleStartMin: z.number().max(59),
          scheduleStartPost: z.enum(['AM', 'PM']),
          scheduleEndHour: z.number().max(12),
          scheduleEndMin: z.number().max(59),
          scheduleEndPost: z.enum(['AM', 'PM']),
          scheduleEndNextDay: z.boolean(),
          withRooms: z.boolean(),
          description: z.string().optional(),
        }),
      }),
    )
    .mutation(({ input }) => {
      const {
        price,
        scheduleStartHour,
        scheduleStartMin,
        scheduleStartPost,
        scheduleEndHour,
        scheduleEndMin,
        scheduleEndPost,
        scheduleEndNextDay,
        withRooms,
        description,
      } = input.details;

      const productData: Omit<IProduct, 'productId'> = {
        ...input,
        price: price,
        scheduleStart: `${scheduleStartHour}:${scheduleStartMin === 0 ? '00' : scheduleStartMin}:00 ${scheduleStartPost}`,
        scheduleEnd: `${scheduleEndHour}:${scheduleEndMin === 0 ? '00' : scheduleEndMin}:00 ${scheduleEndPost}`,
        scheduleEndNextDay,
        withRooms,
        description: description === undefined ? null : description,
        updateLogs: [],
      };

      return ProductService.createProduct(productData);
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
      return updateProductHandler(input.id, input.details);
    }),
  deleteProduct: protectedProcedure.input(z.string()).mutation(({ input }) => {
    return ProductService.deleteProduct(input);
  }),
  getProductById: procedure.input(z.string()).query(({ input }) => {
    return ProductService.findProductById(input);
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
      return ProductService.findProducts(input);
    }),
});
