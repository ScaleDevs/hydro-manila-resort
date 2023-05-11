import create, { StateCreator } from 'zustand';
import { createTrackedSelector } from 'react-tracked';
import { devtools } from 'zustand/middleware';

export type PaymentStates = {
  clientKey: string | null;
  paymentIntentId: string | null;
};

type PaymentActions = {
  setPaymentStates: (data: Partial<PaymentStates>) => void;
  resetStates: () => void;
};

type StoreType = PaymentStates & PaymentActions;

const initState: PaymentStates = {
  clientKey: null,
  paymentIntentId: null,
};

const stateStore = devtools((set) => ({
  ...initState,

  setPaymentStates: (data) => {
    set((states) => ({
      ...states,
      ...data,
    }));
  },

  resetStates: () => set({ ...initState }),
})) as StateCreator<StoreType, [], [], StoreType>;

export const usePaymentStore = create<StoreType>(stateStore);

const usePaymentStoreTrack = createTrackedSelector(usePaymentStore);

export default usePaymentStoreTrack;
