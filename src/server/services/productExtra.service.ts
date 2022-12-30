import { IProductExtra } from '@/utils/types';
import { IFindManyProductExtraInput, ProductExtraRepository } from '@/server/repository/productExtra.repo';
import { TRPCError } from '@trpc/server';

class Service {
  public async createProductExtra(data: Omit<IProductExtra, 'id' | 'activeVersion'>) {
    try {
      return ProductExtraRepository.createProductExtra(data);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findProductExtraById(id: string) {
    try {
      return ProductExtraRepository.findProductExtraById(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findManyProductExtra(inputs: IFindManyProductExtraInput) {
    try {
      return ProductExtraRepository.findManyProductExtra(inputs);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async updateProductExtra(id: string, partialData: Partial<IProductExtra>) {
    try {
      return ProductExtraRepository.updateProductExtra(id, partialData);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async deleteProductExtra(id: string) {
    try {
      return ProductExtraRepository.deleteProductExtra(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const ProductExtraService = new Service();
