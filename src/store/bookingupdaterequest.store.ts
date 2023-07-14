import create, { StateCreator } from 'zustand';
import { createTrackedSelector } from 'react-tracked';
import { devtools } from 'zustand/middleware';
import { z } from 'zod';
import { IBookingPublicOnly, IProduct, IRoom } from '@/utils/types';

export const bookingRequestUpdatesSchema = z.object({
  guests: z.number(),
  productId: z.string().min(1, 'Required'),
  rooms: z.array(z.string().min(1)),
  bookingDate: z.string().min(1, 'Required'),
});

export const customerBankInfoSchema = z.object({
  bankType: z.string().min(1, 'Required'),
  accountNo: z.string().min(1, 'Required'),
  accountName: z.string().min(1, 'Required'),
});

export type BookingRequestUpdates = z.infer<typeof bookingRequestUpdatesSchema>;
export type CustomerBankInfo = z.infer<typeof customerBankInfoSchema>;
export type BookingUpdateCase = 'PARTIAL REFUND' | 'ADDITIONAL PAYMENT' | 'NORMAL';

export type BookingUpdateRequestStates = {
  bookingReferenceNo: string;
  bookingInfo?: IBookingPublicOnly;
  bookingUpdates?: Partial<BookingRequestUpdates>;
  customerBankInfo?: CustomerBankInfo;
  bookingUpdateCase: BookingUpdateCase;
  newTotal: number;
  isRequestSuccess: boolean;
  enteredProduct?: IProduct;
  enteredRooms: IRoom[];
  stepDescription: string;
  stepsLength: number;
};

type BookingUpdateRequestActions = {
  setBookingReferenceNo: (refNo: string) => void;
  setBookingInfo: (data: IBookingPublicOnly) => void;
  setBookingUpdates: (data: BookingRequestUpdates) => void;
  setCustomerBankInfo: (data: CustomerBankInfo) => void;
  setBookingUpdateCase: (data: BookingUpdateCase) => void;
  setIsRequestSuccess: (data: boolean) => void;
  setNewTotal: (amount: number) => void;
  setStepDescription: (desc: string) => void;
  setBookingUpdateStates: (data: Partial<BookingUpdateRequestStates>) => void;
  setEnteredProduct: (product?: IProduct) => void;
  setEnteredRooms: (rooms: IRoom[]) => void;
  resetStates: () => void;
};

type StoreType = BookingUpdateRequestStates & BookingUpdateRequestActions;

const initState: BookingUpdateRequestStates = {
  bookingReferenceNo: '',
  bookingInfo: undefined,
  bookingUpdates: undefined,
  customerBankInfo: undefined,
  bookingUpdateCase: 'NORMAL',
  newTotal: 0,
  isRequestSuccess: false,
  enteredRooms: [],
  stepDescription: 'Find Booking Record',
  stepsLength: 3,
};

const stateStore = devtools((set) => ({
  ...initState,

  setBookingUpdateStates: (data) => {
    set((states) => ({
      ...states,
      ...data,
    }));
  },

  setStepDescription: (desc) => {
    set({ stepDescription: desc });
  },

  setNewTotal: (amount) => {
    set({ newTotal: amount });
  },

  setIsRequestSuccess: (data) => {
    set({ isRequestSuccess: data });
  },

  setBookingReferenceNo: (refNo) => {
    set({ bookingReferenceNo: refNo });
  },

  setBookingInfo: (data) => {
    set({ bookingInfo: { ...data } });
  },

  setBookingUpdates: (data) => {
    set({ bookingUpdates: { ...data } });
  },

  setCustomerBankInfo: (data) => {
    set({ customerBankInfo: { ...data } });
  },

  setBookingUpdateCase: (data) => {
    set({ bookingUpdateCase: data });
  },

  setEnteredProduct: (product) => {
    set({ enteredProduct: product });
  },

  setEnteredRooms: (rooms) => {
    set({ enteredRooms: rooms });
  },

  resetStates: () => set({ ...initState }),
})) as StateCreator<StoreType, [], [], StoreType>;

export const useBookingUpdateRequestStore = create<StoreType>(stateStore);

const useBookingUpdateRequestStoreTrack = createTrackedSelector(useBookingUpdateRequestStore);

export default useBookingUpdateRequestStoreTrack;
