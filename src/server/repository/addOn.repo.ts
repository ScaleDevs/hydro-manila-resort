import prisma from './prisma.client';
import { IPaginationInputs, IAddOn } from '@/utils/types';

export type IFindManyAddOnInput = {
  name?: string;
} & IPaginationInputs;

class Respository {
  public async createAddOn(data: Omit<IAddOn, 'addOnId' | 'activeVersion'>) {
    return prisma.addOn.create({ data: { ...data } });
  }

  public async findAddOnById(id: string) {
    return prisma.addOn.findFirst({ where: { addOnId: id } });
  }

  public async findManyAddOn({ page, limit, name }: IFindManyAddOnInput) {
    const whereFilter = {
      name: {
        startsWith: name,
      },
    };

    const result = await prisma.addOn.findMany({
      where: whereFilter,
      orderBy: { name: 'asc' },
      skip: page > 0 ? (page - 1) * limit : 0,
      take: limit,
    });

    const totalCount = await prisma.addOn.count({
      where: whereFilter,
    });

    return {
      pageCount: Math.ceil(totalCount / limit),
      records: result,
    };
  }

  public async updateAddOn(id: string, partialData: Partial<IAddOn>) {
    return prisma.addOn.update({
      where: { addOnId: id },
      data: partialData,
    });
  }

  public async deleteAddOn(id: string) {
    return prisma.addOn.delete({ where: { addOnId: id } });
  }
}

export const AddOnRepository = new Respository();
