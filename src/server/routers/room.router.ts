import { z } from 'zod';
import { protectedProcedure, procedure, router } from '../trpc';
import { RoomRepository } from '@/server/repository/room.repo';
import { RoomHandler } from '@/server/handlers/room.handler';

export const roomRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        roomIdentityName: z.string(),
        price: z.number(),
        description: z.string().nullable(),
        withBathroom: z.boolean(),
        guests: z.number(),
      }),
    )
    .mutation(({ input }) => {
      return RoomRepository.createRoom({ ...input, updateLogs: [] });
    }),
  updateRoom: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          roomIdentityName: z.string().optional(),
          price: z.number().optional(),
          description: z.string().optional(),
          withBathroom: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return RoomHandler.updateRoom(input.id, input.data);
    }),
  deleteRoom: protectedProcedure.input(z.string()).mutation(({ input }) => {
    return RoomRepository.deleteRoom(input);
  }),
  getRoomById: procedure.input(z.string().min(1)).query(({ input }) => {
    return RoomRepository.findRoomById(input);
  }),
  getRooms: procedure
    .input(
      z.object({
        roomIdentityName: z.string().optional(),
        page: z.number(),
        limit: z.number(),
      }),
    )
    .query(({ input }) => {
      return RoomRepository.findManyRoom(input);
    }),
});
