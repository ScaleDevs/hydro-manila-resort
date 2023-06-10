import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { UpdateLog } from '@prisma/client';
import { IFindProductsInput, ProductRepository } from '@/server/repository/product.repo';
import { IProduct } from '@/utils/types';

export * as ProductHandler from './product.handler';

type SchedParams = {
  scheduleHour: number;
  scheduleMin: number;
  schedulePost: 'AM' | 'PM';
};

export const createProductHandler = async ( details: {
  name: string;
  description?: string | undefined;
  price: number;
  scheduleEndNextDay: boolean;
  withRooms: boolean;
  scheduleStartHour: number;
  scheduleStartMin: number;
  scheduleStartPost: "AM" | "PM";
  scheduleEndHour: number;
  scheduleEndMin: number;
  scheduleEndPost: "AM" | "PM";
}) => {
  try {
    const {
      name,
      price,
      scheduleStartHour,
      scheduleStartMin,
      scheduleStartPost,
      scheduleEndHour,
      scheduleEndMin,
      scheduleEndPost,
      scheduleEndNextDay,
      withRooms,
      description,
    } = details;

    const data: Omit<IProduct, 'productId'> = {
      name,
      price: price,
      scheduleStart: `${scheduleStartHour}:${scheduleStartMin === 0 ? '00' : scheduleStartMin}:00 ${scheduleStartPost}`,
      scheduleEnd: `${scheduleEndHour}:${scheduleEndMin === 0 ? '00' : scheduleEndMin}:00 ${scheduleEndPost}`,
      scheduleEndNextDay,
      withRooms,
      description: description === undefined ? null : description,
      updateLogs: [],
    };
    
    return ProductRepository.createProduct(data);
  } catch (err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
}

export const getProductsHandler = async (inputs: IFindProductsInput) => {
  try {
    return ProductRepository.findProducts(inputs);
  } catch (err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
}

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

  const payload = {
    ...productSchedule,
    ...updateData,
  };
  
  const updateLogs: UpdateLog[] = [];
  const currentProduct = await ProductRepository.findProductById(id);

  Object.entries(payload).forEach((entry) => {
    updateLogs.push({
      updatedBy: 'ADMIN',
      fieldUpdated: entry[0],
      fromValue: `${currentProduct[entry[0] as keyof typeof currentProduct]}`,
      toValue: `${entry[1]}`,
      createdAt: dayjs().toDate(),
    })
  });

  try {
    return ProductRepository.updateProduct(id, {
      ...payload,
      updateLogs,
    });
  } catch (_err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
};
