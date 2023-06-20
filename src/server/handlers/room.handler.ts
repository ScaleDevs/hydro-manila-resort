import dayjs from 'dayjs';
import { UpdateLog } from '@prisma/client';
import { IRoom } from '@/utils/types';
import { RoomRepository } from '@/repo/room.repo';

export * as RoomHandler from './room.handler';

export const updateRoom = async (roomId: string, data: Partial<IRoom>) => {
  const currentRoom = await RoomRepository.findRoomById(roomId);

  const updateLogs: UpdateLog[] = [];

  Object.entries(data).forEach((entry) => {
    updateLogs.push({
      updatedBy: 'ADMIN',
      fieldUpdated: entry[0],
      fromValue: `${currentRoom[entry[0] as keyof typeof currentRoom]}`,
      toValue: `${entry[1]}`,
      createdAt: dayjs().toDate(),
    });
  });

  return RoomRepository.updateRoom(roomId, {
    ...data,
    updateLogs,
  });
};
