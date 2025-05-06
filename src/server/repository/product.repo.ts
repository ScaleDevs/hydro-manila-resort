import { TRPCError } from '@trpc/server';
import prisma from './prisma.client';
import { IPaginationInputs, IProduct, IPromo } from '@/utils/types';

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
    const result = await prisma.product.delete({ where: { productId: id } });
    if (!result) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Product Failed to delete' });
    return result;
  }

  public async addPromo(id: string, promo: IPromo) {
    await prisma.product.update({
      where: {
        productId: id,
      },
      data: {
        promos: {
          push: promo,
        },
      },
    });
  }

  public async deletePromoByIdx(id: string, idx: number) {
    const product = await prisma.product.findUnique({
      where: { productId: id },
      select: { promos: true },
    });

    if (!product) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Product not found' });

    // Remove by index
    const newPromos = [...product.promos];
    newPromos.splice(idx, 1);

    await prisma.product.update({
      where: {
        productId: id,
      },
      data: {
        promos: {
          set: newPromos,
        },
      },
    });
  }
}

export const ProductRepository = new Respository();
