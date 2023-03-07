import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { ScheduledEventService } from '@/svc/scheduledevent.service';

export const scheduledEventRouter = router({
  createScheduledEvent: protectedProcedure
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
  deleteScheduledEvent: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    return ScheduledEventService.deleteScheduledEvent(input);
  }),
  getScheduledEventById: protectedProcedure.input(z.string()).query(({ input }) => {
    return ScheduledEventService.findScheduledEventById(input);
  }),
  getManyScheduledEvent: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        limit: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(({ input }) => {
      return ScheduledEventService.findManyScheduledEvent({
        ...input,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),
});
