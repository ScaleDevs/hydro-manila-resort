import { z } from 'zod';
import { procedure, router } from '../trpc';
import { ProductService } from '@/svc/product.service';

export const productRouter = router({
  list: procedure
    .input(
      z.object({
        category: z.string().optional(),
      }),
    )
    .query(({ input }) => {
      return ProductService.listProducts(input.category);
    }),
  create: procedure
    .input(
      z.object({
        productName: z.string(),
        productPrice: z.number(),
        productCategory: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return ProductService.createProduct(input);
    }),
});
