import prisma from './prisma.client';
import { IPaginationInputs, IRoom } from '@/utils/types';
import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export type IFindManyroomInput = {
  roomIdentityName?: string;
} & IPaginationInputs;

class Respository {
  public async createRoom(data: Omit<IRoom, 'roomId' | 'activeVersion'>) {
    return prisma.room.create({ data: { ...data } });
  }

  public async findRoomById(id: string) {
    const room = await prisma.room.findFirst({ where: { roomId: id } });
    if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found!' });
    return room;
  }

  public async findManyRoom({ page, limit, roomIdentityName }: IFindManyroomInput) {
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
  }

  public async updateRoom(id: string, partialData: Partial<IRoom>) {
    return prisma.room.update({
      where: { roomId: id },
      data: partialData,
    });
  }

  public async deleteRoom(id: string) {
    return prisma.room.delete({ where: { roomId: id } });
  }

  public async getRoomDetails(roomId: string) {
    const room = await this.findRoomById(roomId);
    if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found!' });
    return { room, roomDetails: room.details[0] };
  }
}

export const RoomRepository = new Respository();
