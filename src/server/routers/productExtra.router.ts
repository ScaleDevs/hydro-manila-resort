import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { procedure, router } from '../trpc';
import { ProductExtraService } from '@/svc/productExtra.service';
import { IProductExtra } from '@/utils/types';

export const productExtraRouter = router({
  create: procedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(['ROOM', 'PERSON']),
        details: z.object({
          price: z.number(),
          description: z.string(),
        }),
      }),
    )
    .mutation(({ input }) => {
      const { price, description } = input.details;

      const data: Omit<IProductExtra, 'id' | 'activeVersion'> = {
        ...input,
        details: [
          {
            price,
            description,
          },
        ],
      };

      return ProductExtraService.createProductExtra(data);
    }),
  getProductExtraById: procedure.input(z.string()).query(({ input }) => {
    return ProductExtraService.findProductExtraById(input);
  }),
  updateProductExtra: procedure
    .input(
      z.object({
        id: z.string(),
        partialData: z.object({
          name: z.string().optional(),
          type: z.enum(['ROOM', 'PERSON']).optional(),
          activeVersion: z.number().optional(),
        }),
      }),
    )
    .mutation(({ input }) => {
      return ProductExtraService.updateProductExtra(input.id, input.partialData);
    }),
  createNewProductExtraVersion: procedure
    .input(
      z.object({
        id: z.string(),
        details: z.object({
          price: z.number().optional(),
          description: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, details } = input;
      const currentProductExtra = await ProductExtraService.findProductExtraById(id);

      if (!currentProductExtra) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Product Extra does not exist' });

      const currDetailsLength = currentProductExtra.details.length;

      const newProductExtraDetails = {
        ...currentProductExtra.details[currDetailsLength - 1],
        ...details,
      };

      return ProductExtraService.updateProductExtra(id, {
        activeVersion: currDetailsLength + 1,
        details: [...currentProductExtra.details, newProductExtraDetails],
      });
    }),
  deleteProductExtra: procedure.input(z.string()).mutation(({ input }) => {
    return ProductExtraService.deleteProductExtra(input);
  }),
});
