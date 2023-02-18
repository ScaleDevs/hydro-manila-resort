import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { procedure, router } from '../trpc';
import { RoomService } from '@/server/services/room.service';
import { IRoom } from '@/utils/types';

export const roomRouter = router({
  create: procedure
    .input(
      z.object({
        roomIdentityName: z.string(),
        details: z.object({
          price: z.number(),
          description: z.string().nullable(),
          withBathroom: z.boolean(),
          guests: z.number(),
        }),
      }),
    )
    .mutation(({ input }) => {
      const { details, ...rest } = input;

      const data: Omit<IRoom, 'roomId' | 'activeVersion'> = {
        ...rest,
        details: [
          {
            ...details,
          },
        ],
      };

      return RoomService.createRoom(data);
    }),
  updateRoom: procedure
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
      return RoomService.updateRoom(input.id, input.partialData);
    }),
  createNewRoomVersion: procedure
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
      const currentRoom = await RoomService.findRoomById(id);

      if (!currentRoom) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Product Extra does not exist' });

      const currDetailsLength = currentRoom.details.length;

      const newRoometails = {
        ...currentRoom.details[currDetailsLength - 1],
        ...details,
      };

      return RoomService.updateRoom(id, {
        activeVersion: currDetailsLength + 1,
        details: [...currentRoom.details, newRoometails],
      });
    }),
  deleteRoom: procedure.input(z.string()).mutation(({ input }) => {
    return RoomService.deleteRoom(input);
  }),
  getRoomById: procedure.input(z.string()).query(({ input }) => {
    if (input === '') return null;
    return RoomService.findRoomById(input);
  }),
  getRooms: procedure
    .input(
      z.object({
        name: z.string().optional(),
        page: z.number(),
        limit: z.number(),
      }),
    )
    .query(({ input }) => {
      return RoomService.findManyRoom(input);
    }),
});
