import prisma from './prisma.client';
import { IPaginationInputs, IRoom } from '@/utils/types';
import { Prisma } from '@prisma/client';

export type IFindManyroomInput = {
  roomNumber?: number;
} & IPaginationInputs;

class Respository {
  public async createRoom(data: Omit<IRoom, 'roomId' | 'activeVersion'>) {
    return prisma.room.create({ data: { ...data } });
  }

  public async findRoomById(id: string) {
    return prisma.room.findFirst({ where: { roomId: id } });
  }

  public async findManyRoom({ page, limit, roomNumber }: IFindManyroomInput) {
    const whereFilter: Prisma.RoomWhereInput = {
      roomNumber: {
        equals: roomNumber,
      },
    };

    const result = await prisma.room.findMany({
      where: whereFilter,
      orderBy: { roomNumber: 'asc' },
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
}

export const RoomRepository = new Respository();
