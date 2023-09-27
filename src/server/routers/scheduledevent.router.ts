import { z } from 'zod';
import { protectedProcedure, router } from '@/server/trpc';
import { ScheduledEventService } from '@/svc/scheduledevent.service';
import { ScheduledEventRepository } from '@/repo/scheduledevent.repo';

export const scheduledEventRouter = router({
  createScheduledEvent: protectedProcedure
    .input(
      z.object({
        guestName: z.string().min(1),
        guests: z.number(),
        description: z.string(),
        startSession: z.string().min(1),
        endSession: z.string().min(1),
        createdBy: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return ScheduledEventService.createScheduledEvent(input);
    }),
  deleteScheduledEvent: protectedProcedure
    .input(
      z.object({
        scheduleEventId: z.string(),
        calendarEventId: z.string().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      return ScheduledEventService.deleteScheduledEvent(input.scheduleEventId, input.calendarEventId);
    }),
  getScheduledEventById: protectedProcedure.input(z.string()).query(({ input }) => {
    return ScheduledEventRepository.findScheduledEventById(input);
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
      return ScheduledEventRepository.findManyScheduledEvent({
        ...input,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),
});
