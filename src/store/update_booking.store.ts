import create, { StateCreator } from 'zustand';
import { createTrackedSelector } from 'react-tracked';
import { devtools } from 'zustand/middleware';
import { z } from 'zod';
import { IBookingPublicOnly, ProductV2, IRoom } from '@/utils/types';

export const bookingRequestUpdatesSchema = z.object({
  guests: z.object({
    overNightGuests: z.preprocess((val) => Number(val), z.number()),
    nonOverNightGuests: z.preprocess((val) => Number(val), z.number()),
  }),
  rooms: z.array(z.string()),
  bookingDate: z.string(),
});

export const customerBankInfoSchema = z.object({
  bankType: z.string().min(1, 'Required'),
  accountNo: z.string().min(1, 'Required'),
  accountName: z.string().min(1, 'Required'),
});

export type BookingRequestUpdates = {
  guests: {
    overNightGuests: number;
    nonOverNightGuests: number;
  };
  rooms: string[];
  bookingDate: string;
};

export type CustomerBankInfo = z.infer<typeof customerBankInfoSchema>;
export type BookingUpdateCase = 'PARTIAL REFUND' | 'ADDITIONAL PAYMENT' | 'NORMAL';

export type UpdateBookingStoreStates = {
  bookingReferenceNo: string;
  bookingInfo?: IBookingPublicOnly;
  bookingUpdates?: Partial<BookingRequestUpdates>;
  customerBankInfo?: CustomerBankInfo;
  bookingUpdateCase: BookingUpdateCase;
  currentFreeGuests: number;
  selectedProduct?: ProductV2;
  selectedRooms: Map<string, IRoom>;
  isRequestSuccess: boolean;
  newTotal: number;
  stepDescription: string;
  stepsLength: number;
};

type Actions = {
  setBookingReferenceNo: (refNo: string) => void;
  setBookingInfo: (data: IBookingPublicOnly) => void;
  setBookingUpdates: (data: Partial<BookingRequestUpdates>) => void;
  setCustomerBankInfo: (data: CustomerBankInfo) => void;
  setBookingUpdateCase: (data: BookingUpdateCase) => void;
  setStateField: (label: keyof UpdateBookingStoreStates, value: any) => void;
  setStateObject: (data: Partial<UpdateBookingStoreStates>) => void;
  resetStates: () => void;
};

type StoreType = UpdateBookingStoreStates & Actions;

const initState: UpdateBookingStoreStates = {
  bookingReferenceNo: '',
  bookingInfo: undefined,
  bookingUpdates: undefined,
  customerBankInfo: undefined,
  bookingUpdateCase: 'NORMAL',
  currentFreeGuests: 0,
  newTotal: 0,
  isRequestSuccess: false,
  selectedProduct: undefined,
  selectedRooms: new Map(),
  stepDescription: 'Find Booking Record',
  stepsLength: 3,
};

const stateStore = devtools((set) => ({
  ...initState,

  setStateField: (label, value) => set({ [`${label}`]: value }),

  setStateObject: (data) => {
    set((states) => ({
      ...states,
      ...data,
    }));
  },

  setBookingReferenceNo: (refNo) => {
    set({ bookingReferenceNo: refNo });
  },

  setBookingInfo: (data) => {
    set({ bookingInfo: { ...data } });
  },

  setBookingUpdates: (data) => {
    set((states) => ({
      bookingUpdates: {
        ...states.bookingUpdates,
        ...data,
      },
    }));
  },

  setCustomerBankInfo: (data) => {
    set({ customerBankInfo: { ...data } });
  },

  setBookingUpdateCase: (data) => {
    set({ bookingUpdateCase: data });
  },

  resetStates: () => set({ ...initState }),
})) as StateCreator<StoreType, [], [], StoreType>;

export const useUpdateBookingStore = create<StoreType>(stateStore);

const useUpdateBookingStoreTrack = createTrackedSelector(useUpdateBookingStore);

export default useUpdateBookingStoreTrack;
