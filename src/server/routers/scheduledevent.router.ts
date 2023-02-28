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
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(({ input }) => {
      return ScheduledEventService.findManyScheduledEvent({
        ...input,
        startDate: dayjs.utc(input.startDate).toISOString(),
        endDate: dayjs.utc(input.endDate).toISOString(),
      });
    }),
});
