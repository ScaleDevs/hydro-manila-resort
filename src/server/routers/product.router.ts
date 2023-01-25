import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { procedure, router } from '../trpc';
import { ProductService } from '@/svc/product.service';
import { IProduct } from '@/utils/types';

export const productRouter = router({
  create: procedure
    .input(
      z.object({
        name: z.string(),
        details: z.object({
          price: z.number(),
          minHeadCount: z.number(),
          maxHeadCount: z.number(),
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
        minHeadCount,
        maxHeadCount,
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

      const productData: Omit<IProduct, 'id' | 'activeVersion'> = {
        ...input,
        details: [
          {
            price: price,
            minHeadCount: minHeadCount,
            maxHeadCount: maxHeadCount,
            scheduleStart: `${scheduleStartHour}:${scheduleStartMin}:00 ${scheduleStartPost}`,
            scheduleEnd: `${scheduleEndHour}:${scheduleEndMin}:00 ${scheduleEndPost}`,
            scheduleEndNextDay: scheduleEndNextDay,
            withRooms,
            description: description === undefined ? null : description,
          },
        ],
      };

      return ProductService.createProduct(productData);
    }),
  updateProduct: procedure
    .input(
      z.object({
        id: z.string(),
        partialData: z.object({
          name: z.string().optional(),
          activeVersion: z.number().optional(),
        }),
      }),
    )
    .mutation(({ input }) => {
      return ProductService.updateProduct(input.id, input.partialData);
    }),
  createNewProductVersion: procedure
    .input(
      z.object({
        id: z.string(),
        details: z.object({
          price: z.number().optional(),
          minHeadCount: z.number().optional(),
          maxHeadCount: z.number().optional(),
          scheduleStartHour: z.number().max(12).optional(),
          scheduleStartMin: z.number().max(59).optional(),
          scheduleStartPost: z.enum(['AM', 'PM']).optional(),
          scheduleEndHour: z.number().max(12).optional(),
          scheduleEndMin: z.number().max(59).optional(),
          scheduleEndPost: z.enum(['AM', 'PM']).optional(),
          scheduleEndDay: z.number().max(1).optional(),
          withRooms: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, details } = input;
      const currentProduct = await ProductService.findProductById(id);

      if (!currentProduct) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Product Extra does not exist' });

      const { scheduleStartHour, scheduleStartMin, scheduleStartPost, scheduleEndHour, scheduleEndMin, scheduleEndPost } =
        details;
      const currentProductDetailsLength = currentProduct.details.length;
      const scheduleStart =
        scheduleStartHour && scheduleStartMin && scheduleStartPost
          ? `${scheduleStartHour}:${scheduleStartMin}:00 ${scheduleStartPost}`
          : undefined;
      const scheduleEnd =
        scheduleEndHour && scheduleEndMin && scheduleEndPost
          ? `${scheduleEndHour}:${scheduleEndMin}:00 ${scheduleEndPost}`
          : undefined;

      const newProductDetails = {
        ...currentProduct.details[currentProductDetailsLength - 1],
        ...details,
      };

      delete newProductDetails.scheduleStartHour;
      delete newProductDetails.scheduleStartMin;
      delete newProductDetails.scheduleStartPost;
      delete newProductDetails.scheduleEndHour;
      delete newProductDetails.scheduleEndMin;
      delete newProductDetails.scheduleEndPost;

      if (!!scheduleStart) newProductDetails['scheduleStart'] = scheduleStart;
      if (!!scheduleEnd) newProductDetails['scheduleEnd'] = scheduleEnd;

      return ProductService.updateProduct(id, {
        activeVersion: currentProductDetailsLength + 1,
        details: [...currentProduct.details, newProductDetails],
      });
    }),
  deleteProduct: procedure.input(z.string()).mutation(({ input }) => {
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
