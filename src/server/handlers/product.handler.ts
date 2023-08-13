import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { UpdateLog } from '@prisma/client';
import { IFindProductsInput, ProductRepository } from '@/repo/product.repo';
import { ProductV2, IProduct } from '@/utils/types';
import { RoomRepository } from '../repository/room.repo';

export * as ProductHandler from './product.handler';

type SchedParams = {
  scheduleHour: number;
  scheduleMin: number;
  schedulePost: 'AM' | 'PM';
};

export const createProductHandler = async (details: {
  name: string;
  description?: string | undefined;
  price: number;
  scheduleEndNextDay: boolean;
  includedRooms: string[];
  scheduleStartHour: number;
  scheduleStartMin: number;
  scheduleStartPost: 'AM' | 'PM';
  scheduleEndHour: number;
  scheduleEndMin: number;
  scheduleEndPost: 'AM' | 'PM';
  isAllRooms: boolean;
  guestSetting: {
    nonOverNightGuestFee: number;
    minNonOverNightGuestPax: number;
    maxNonOverNightGuestPax: number;
    overNightGuestFee: number;
    minOverNightGuestPax: number;
    maxOverNightGuestPax: number;
  };
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
      includedRooms,
      description,
      ...rest
    } = details;

    const data: Omit<IProduct, 'productId'> = {
      name,
      price: price,
      scheduleStart: `${scheduleStartHour}:${scheduleStartMin === 0 ? '00' : scheduleStartMin}:00 ${scheduleStartPost}`,
      scheduleEnd: `${scheduleEndHour}:${scheduleEndMin === 0 ? '00' : scheduleEndMin}:00 ${scheduleEndPost}`,
      scheduleEndNextDay,
      includedRooms,
      description: description === undefined ? null : description,
      updateLogs: [],
      ...rest,
    };

    return ProductRepository.createProduct(data);
  } catch (err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
};

export const getProductsHandler = async (inputs: IFindProductsInput) => {
  try {
    const result = await ProductRepository.findProducts(inputs);
    const roomsResult = await RoomRepository.findManyRoom({ limit: 100, page: 1 });
    const roomsMap = new Map(roomsResult.records.map((val) => [val.roomId, val.roomIdentityName]));
    const products: ProductV2[] = [];

    for (const product of result.records) {
      const includedRoomsName: string[] = [];

      for (const roomId of product.includedRooms) includedRoomsName.push(roomsMap.get(roomId) || '');

      products.push({
        ...product,
        includedRoomsName,
      });
    }

    return {
      pageCount: result.pageCount,
      records: products,
    };
  } catch (err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
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
    });
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
