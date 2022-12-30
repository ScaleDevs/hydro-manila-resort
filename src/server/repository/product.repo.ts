import prisma from './prisma.client';
import { IPaginationInputs, IProduct } from '@/utils/types';

export type IFindProductsInput = {
  name?: string;
} & IPaginationInputs;

class Respository {
  public async createProduct(productData: Omit<IProduct, 'id' | 'activeVersion'>) {
    const product = await prisma.product.create({ data: { ...productData } });
    return product;
  }

  public async findProductById(id: string) {
    const product = await prisma.product.findFirst({ where: { id } });
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
      where: { id },
      data: partialData,
    });
  }

  public async deleteProduct(id: string) {
    const product = await prisma.product.delete({ where: { id } });
    return product;
  }
}

export const ProductRepository = new Respository();
