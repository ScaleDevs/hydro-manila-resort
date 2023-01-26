import { IAddOn } from '@/utils/types';
import { IFindManyAddOnInput, AddOnRepository } from '@/server/repository/addOn.repo';
import { TRPCError } from '@trpc/server';

class Service {
  public async createAddOn(data: Omit<IAddOn, 'addOnId' | 'activeVersion'>) {
    try {
      return AddOnRepository.createAddOn(data);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findAddOnById(id: string) {
    try {
      return AddOnRepository.findAddOnById(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findManyAddOn(inputs: IFindManyAddOnInput) {
    try {
      return AddOnRepository.findManyAddOn(inputs);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async updateAddOn(id: string, partialData: Partial<IAddOn>) {
    try {
      return AddOnRepository.updateAddOn(id, partialData);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async deleteAddOn(id: string) {
    try {
      return AddOnRepository.deleteAddOn(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const AddOnService = new Service();
