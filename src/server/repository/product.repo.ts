import { TRPCError } from '@trpc/server';
import prisma from './prisma.client';
import { IPaginationInputs, IProduct } from '@/utils/types';

export type IFindProductsInput = {
  name?: string;
} & IPaginationInputs;

class Respository {
  public async createProduct(productData: Omit<IProduct, 'productId' | 'activeVersion'>) {
    return prisma.product.create({ data: { ...productData } });
  }

  public async findProductById(id: string) {
    const product = await prisma.product.findFirst({ where: { productId: id } });
    if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product Record not found' });
    return product;
  }

  public async findProducts({ page, limit, name }: IFindProductsInput) {
    const whereFilter = {
      name: {
        startsWith: name,
      },
    };

    const result = await prisma.product.findMany({
      where: whereFilter,
      orderBy: { name: 'asc' },
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    const totalCount = await prisma.product.count({
      where: whereFilter,
    });

    return {
      pageCount: Math.ceil(totalCount / limit),
      records: result,
    };
  }

  public async updateProduct(id: string, partialData: Partial<IProduct>) {
    return prisma.product.update({
      where: { productId: id },
      data: partialData,
    });
  }

  public async deleteProduct(id: string) {
    return prisma.product.delete({ where: { productId: id } });
  }

  public async getProductDetails(productId: string, version?: number) {
    const product = await this.findProductById(productId);
    if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product Record not found' });
    return { productDetails: product.details[version || product.activeVersion - 1], product };
  }
}

export const ProductRepository = new Respository();
