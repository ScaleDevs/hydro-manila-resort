import { IProduct } from '@/utils/types';
import { IFindProductsInput, ProductRepository } from '@/server/repository/product.repo';
import { TRPCError } from '@trpc/server';

class Service {
  public async createProduct(productData: Omit<IProduct, 'id' | 'activeVersion'>) {
    try {
      return ProductRepository.createProduct(productData);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findProductById(id: string) {
    try {
      return ProductRepository.findProductById(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async findProducts(inputs: IFindProductsInput) {
    try {
      return ProductRepository.findProducts(inputs);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async updateProduct(id: string, partialData: Partial<IProduct>) {
    try {
      return ProductRepository.updateProduct(id, partialData);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }

  public async deleteProduct(id: string) {
    try {
      return ProductRepository.deleteProduct(id);
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
  }
}

export const ProductService = new Service();
