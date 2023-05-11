import create, { StateCreator } from 'zustand';
import { createTrackedSelector } from 'react-tracked';
import { devtools } from 'zustand/middleware';

export type BookingState = {
  name: string;
  email: string;
  phoneNumber: string;
  startSession: string;
  endSession: string;
  guests: number;
  roomId: string | null;
  roomVersion: number;
  productId: string;
  productVersion: number;
  receipt: {
    productPrice: number;
    roomPrice: number;
    additionalHeadsPrice: number;
    total: number;
  };

  getBookingStates: () => Omit<
    BookingState,
    'getBookingStates' | 'setBookingState' | 'resetBookingState' | 'setWholeBookingState'
  >;

  setBookingState: (
    label: keyof Omit<BookingState, 'getBookingStates' | 'setBookingState' | 'resetBookingState' | 'setWholeBookingState'>,
    value: any,
  ) => void;

  setWholeBookingState: (
    bookingStates: Omit<BookingState, 'getBookingStates' | 'setBookingState' | 'resetBookingState' | 'setWholeBookingState'>,
  ) => void;

  resetBookingState: () => void;
};

const initState: Omit<BookingState, 'getBookingStates' | 'setBookingState' | 'resetBookingState' | 'setWholeBookingState'> = {
  name: '',
  email: '',
  phoneNumber: '',
  startSession: '',
  endSession: '',
  guests: 0,
  roomId: '',
  roomVersion: 0,
  productId: '',
  productVersion: 0,
  receipt: {
    productPrice: 0,
    roomPrice: 0,
    additionalHeadsPrice: 0,
    total: 0,
  },
};

const stateStore = devtools((set, get) => ({
  ...initState,

  getBookingStates: () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { getBookingStates, setBookingState, setWholeBookingState, resetBookingState, ...restBookingState } = get();

    return restBookingState;
  },

  setBookingState: (label, value) => set({ [`${label}`]: value }),

  setWholeBookingState: (bookingState: BookingState | Partial<BookingState>) =>
    set((current) => ({ ...current, ...bookingState })),

  resetBookingState: () => set({ ...initState }),
})) as StateCreator<BookingState, [], [], BookingState>;

export const useBookingStore = create<BookingState>(stateStore);

const useBookingStoreTrack = createTrackedSelector(useBookingStore);

export default useBookingStoreTrack;
