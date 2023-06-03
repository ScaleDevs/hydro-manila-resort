import { TRPCError } from '@trpc/server';
import { ProductRepository } from '@/server/repository/product.repo';
import { IProduct } from '@/utils/types';

type SchedParams = {
  scheduleHour: number;
  scheduleMin: number;
  schedulePost: 'AM' | 'PM';
};

export const updateProductHandler = async (
  id: string,
  updateData: {
    name?: string;
    price?: number;
    schedStartParams?: SchedParams;
    schedEndParams?: SchedParams;
    scheduleEndNextDay?: boolean;
    withRooms?: boolean;
    description?: string;
  },
) => {
  const productSchedule: Partial<IProduct> = {};

  if (updateData.schedStartParams) {
    const { scheduleHour, scheduleMin, schedulePost } = updateData.schedStartParams;
    productSchedule['scheduleStart'] = `${scheduleHour}:${scheduleMin}:00 ${schedulePost}`;
  }

  if (updateData.schedEndParams) {
    const { scheduleHour, scheduleMin, schedulePost } = updateData.schedEndParams;
    productSchedule['scheduleEnd'] = `${scheduleHour}:${scheduleMin}:00 ${schedulePost}`;
  }

  delete updateData.schedStartParams;
  delete updateData.schedEndParams;

  try {
    return ProductRepository.updateProduct(id, {
      ...productSchedule,
      ...updateData,
    });
  } catch (_err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
};
