import { z } from 'zod';
import dayjs from 'dayjs';
import { procedure, router } from '../trpc';
import { ScheduledEventService } from '@/svc/scheduledevent.service';

export const scheduledEventRouter = router({
  createScheduledEvent: procedure
    .input(
      z.object({
        startSession: z.string(),
        endSession: z.string(),
        description: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return ScheduledEventService.createScheduledEvent(input);
    }),
  deleteScheduledEvent: procedure.input(z.string()).mutation(async ({ input }) => {
    return ScheduledEventService.deleteScheduledEvent(input);
  }),
  getScheduledEventById: procedure.input(z.string()).query(({ input }) => {
    return ScheduledEventService.findScheduledEventById(input);
  }),
  getManyScheduledEvent: procedure
    .input(
      z.object({
        page: z.number(),
        limit: z.number(),
        startSession: z
          .object({
            startDate: z.string(),
            endDate: z.string(),
          })
          .optional(),
        endSession: z
          .object({
            startDate: z.string(),
            endDate: z.string(),
          })
          .optional(),
      }),
    )
    .query(({ input }) => {
      const inputRefine: typeof input = {
        page: input.page,
        limit: input.limit,
      };

      if (
        input.startSession &&
        (!!input.startSession?.startDate || input.startSession.startDate !== '') &&
        (!!input.startSession?.endDate || input.startSession.endDate !== '')
      ) {
        inputRefine['startSession'] = {
          startDate: dayjs.utc(input.startSession.startDate).toISOString() as any,
          endDate: dayjs.utc(input.startSession.endDate).toISOString() as any,
        };
      }

      if (
        input.endSession &&
        (!!input.endSession?.startDate || input.endSession.startDate !== '') &&
        (!!input.endSession?.endDate || input.endSession.endDate !== '')
      ) {
        inputRefine['endSession'] = {
          startDate: dayjs.utc(input.endSession.startDate).toISOString() as any,
          endDate: dayjs.utc(input.endSession.endDate).toISOString() as any,
        };
      }

      return ScheduledEventService.findManyScheduledEvent(inputRefine);
    }),
});
