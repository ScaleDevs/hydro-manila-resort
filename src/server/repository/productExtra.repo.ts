import prisma from './prisma.client';
import { IPaginationInputs, IProductExtra } from '@/utils/types';

export type IFindManyProductExtraInput = {
  name?: string;
} & IPaginationInputs;

class Respository {
  public async createProductExtra(data: Omit<IProductExtra, 'id' | 'activeVersion'>) {
    return prisma.productExtra.create({ data: { ...data } });
  }

  public async findProductExtraById(id: string) {
    return prisma.productExtra.findFirst({ where: { id } });
  }

  public async findManyProductExtra({ page, limit, name }: IFindManyProductExtraInput) {
    const whereFilter = {
      name: {
        startsWith: name,
      },
    };

    const result = await prisma.productExtra.findMany({
      where: whereFilter,
      orderBy: { name: 'asc' },
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    const totalCount = await prisma.productExtra.count({
      where: whereFilter,
    });

    return {
      pageCount: Math.ceil(totalCount / limit),
      records: result,
    };
  }

  public async updateProductExtra(id: string, partialData: Partial<IProductExtra>) {
    return prisma.productExtra.update({
      where: { id },
      data: partialData,
    });
  }

  public async deleteProductExtra(id: string) {
    return prisma.productExtra.delete({ where: { id } });
  }
}

export const ProductExtraRepository = new Respository();
