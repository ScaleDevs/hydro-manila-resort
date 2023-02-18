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
      console.log('=HERE=');
      console.log(input.startSession);
      console.log(dayjs.utc(input.startSession).toISOString());
      return ScheduledEventService.createScheduledEvent({
        ...input,
        startSession: dayjs.utc(input.startSession).toISOString() as any,
        endSession: dayjs.utc(input.endSession).toISOString() as any,
      });
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
      }),
    )
    .query(({ input }) => {
      return ScheduledEventService.findManyScheduledEvent(input);
    }),
});
