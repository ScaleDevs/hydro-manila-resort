import { IRoom } from '@/utils/types';
import { IFindManyroomInput, RoomRepository } from '@/server/repository/room.repo';
import { TRPCError } from '@trpc/server';

class Service {
  public async createRoom(data: Omit<IRoom, 'roomId' | 'activeVersion'>) {
    try {
      return RoomRepository.createRoom(data);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findRoomById(id: string) {
    try {
      return RoomRepository.findRoomById(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findManyRoom(inputs: IFindManyroomInput) {
    try {
      return RoomRepository.findManyRoom(inputs);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async updateRoom(id: string, partialData: Partial<IRoom>) {
    try {
      return RoomRepository.updateRoom(id, partialData);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async deleteRoom(id: string) {
    try {
      return RoomRepository.deleteRoom(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const RoomService = new Service();
