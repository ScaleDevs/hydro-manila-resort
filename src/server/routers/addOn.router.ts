import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { procedure, router } from '../trpc';
import { AddOnService } from '@/server/services/addOn.service';
import { IAddOn } from '@/utils/types';

export const addOnRouter = router({
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

      const data: Omit<IAddOn, 'addOnId' | 'activeVersion'> = {
        ...input,
        details: [
          {
            price,
            description,
          },
        ],
      };

      return AddOnService.createAddOn(data);
    }),
  updateAddOn: procedure
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
      return AddOnService.updateAddOn(input.id, input.partialData);
    }),
  createNewAddOnVersion: procedure
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
      const currentAddOn = await AddOnService.findAddOnById(id);

      if (!currentAddOn) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Product Extra does not exist' });

      const currDetailsLength = currentAddOn.details.length;

      const newAddOnDetails = {
        ...currentAddOn.details[currDetailsLength - 1],
        ...details,
      };

      return AddOnService.updateAddOn(id, {
        activeVersion: currDetailsLength + 1,
        details: [...currentAddOn.details, newAddOnDetails],
      });
    }),
  deleteAddOn: procedure.input(z.string()).mutation(({ input }) => {
    return AddOnService.deleteAddOn(input);
  }),
  getAddOnById: procedure.input(z.string()).query(({ input }) => {
    return AddOnService.findAddOnById(input);
  }),
  getAddOns: procedure
    .input(
      z.object({
        name: z.string().optional(),
        page: z.number(),
        limit: z.number(),
      }),
    )
    .query(({ input }) => {
      return AddOnService.findManyAddOn(input);
    }),
});
