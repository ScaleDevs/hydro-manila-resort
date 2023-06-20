import create, { StateCreator } from 'zustand';
import { createTrackedSelector } from 'react-tracked';
import { devtools } from 'zustand/middleware';
import { IProduct, IRoom } from '@/utils/types';

export enum BookingSteps {
  step1 = 'Date & Time',
  step2 = 'Addons',
  step3 = 'Personal Details',
  step4 = 'Review Details',
}

export type BookingPayload = {
  name: string;
  email: string;
  phoneNumber: string;
  bookingDate: string;
  guests: number;
  roomId: string | null;
  productId: string;
};

export type BookingState = {
  data: BookingPayload;
  selectedProduct: IProduct | null;
  selectedRoom: IRoom | null;
  stepDescription: string;
  stepsLength: number;
};

export type BookingActions = {
  getBookingStates: () => BookingState;

  setBookingState: (label: keyof BookingState, value: any) => void;

  setBookingStateData: (newData: Partial<BookingPayload>) => void;

  resetBookingState: () => void;
};

const initState: BookingState = {
  data: {
    name: '',
    email: '',
    phoneNumber: '',
    bookingDate: '',
    guests: 0,
    roomId: null,
    productId: '',
  },
  selectedProduct: null,
  selectedRoom: null,
  stepDescription: BookingSteps.step1,
  stepsLength: 5,
};

type StoreType = BookingState & BookingActions;

const stateStore = devtools((set, get) => ({
  ...initState,

  getBookingStates: () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const states = get();

    return states;
  },

  setBookingState: (label, value) => set({ [`${label}`]: value }),

  setBookingStateData: (newData) => {
    const bookingData = get().data;
    set({ data: { ...bookingData, ...newData } });
  },

  resetBookingState: () => set({ ...initState }),
})) as StateCreator<StoreType, [], [], StoreType>;

export const useBookingStore = create<StoreType>(stateStore);

const useBookingStoreTrack = createTrackedSelector(useBookingStore);

export default useBookingStoreTrack;
