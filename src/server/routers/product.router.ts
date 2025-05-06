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
  addPromo: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        promo: z
          .object({
            promoName: z.string(),
            paxInclusion: z.number().nullable(),
            promoStart: z.string(),
            promoEnd: z.string(),
            price: z.number().nullable(),
            dayRates: z.array(
              z.object({
                days: z.array(z.number().int().min(0).max(6)),
                price: z.number().nonnegative(),
              }),
            ),
          })
          .superRefine((promo, ctx) => {
            const { price, dayRates } = promo;

            // Check if dayRates is empty — if so, price must be present and valid
            if (!dayRates || dayRates.length === 0) {
              if (price === undefined || price === null || typeof price !== 'number' || isNaN(price)) {
                ctx.addIssue({
                  path: ['price'],
                  code: z.ZodIssueCode.custom,
                  message: 'Price is required when dayRates are not provided.',
                });
              }
              return;
            }

            // Validate full day coverage and no duplicates
            const allDays = new Set<number>();
            const duplicates = new Set<number>();

            for (let i = 0; i < dayRates.length; i++) {
              const rate = dayRates[i];

              for (const day of rate.days) {
                if (allDays.has(day)) {
                  duplicates.add(day);
                } else {
                  allDays.add(day);
                }
              }
            }

            if (duplicates.size > 0) {
              ctx.addIssue({
                path: ['dayRates'],
                code: z.ZodIssueCode.custom,
                message: `Each day can only belong to one rate. Duplicates found for: ${[...duplicates]
                  .sort()
                  .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
                  .join(', ')}.`,
              });
            }

            if (allDays.size !== 7) {
              ctx.addIssue({
                path: ['dayRates'],
                code: z.ZodIssueCode.custom,
                message: 'You must provide promo rates for every day of the week.',
              });
            }
          }),
      }),
    )
    .mutation(({ input }) => {
      return ProductHandler.addPromoHandler(input.id, {
        ...input.promo,
        price: input.promo.price,
      });
    }),
});
