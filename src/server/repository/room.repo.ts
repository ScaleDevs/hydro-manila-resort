import prisma from './prisma.client';
import { IPaginationInputs, IRoom } from '@/utils/types';
import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export type IFindManyroomInput = {
  roomIdentityName?: string;
} & IPaginationInputs;

class Respository {
  public async createRoom(data: Omit<IRoom, 'roomId'>) {
    try {
      const room = await prisma.room.create({ data: { ...data } });
      return room;
    } catch (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Repo ==> createRoom()' });
    }
  }

  public async findRoomById(id: string) {
    const room = await prisma.room.findFirst({ where: { roomId: id } });
    if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found!' });
    return room;
  }

  public async findRoomsByIds(ids: string[]) {
    if (ids.length === 0) return [];
    const room = await prisma.room.findMany({ where: { roomId: { in: ids } } });
    return room;
  }

  public async findManyRoom({ page, limit, roomIdentityName }: IFindManyroomInput) {
    try {
      const whereFilter: Prisma.RoomWhereInput = {
        roomIdentityName: {
          equals: roomIdentityName,
        },
      };

      const result = await prisma.room.findMany({
        where: whereFilter,
        orderBy: { roomId: 'asc' },
        skip: page > 0 ? (page - 1) * limit : 0,
        take: limit,
      });

      const totalCount = await prisma.room.count({
        where: whereFilter,
      });

      return {
        pageCount: Math.ceil(totalCount / limit),
        records: result,
      };
    } catch (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Repo ==> findManyRoom()' });
    }
  }

  public async updateRoom(id: string, partialData: Partial<IRoom>) {
    return prisma.room.update({
      where: { roomId: id },
      data: partialData,
    });
  }

  public async deleteRoom(id: string) {
    try {
      return prisma.room.delete({ where: { roomId: id } });
    } catch (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error :: Repo ==> deleteRoom()' });
    }
  }
}

export const RoomRepository = new Respository();
