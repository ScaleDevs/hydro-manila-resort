import create, { StateCreator } from 'zustand';
import { createTrackedSelector } from 'react-tracked';
import { devtools } from 'zustand/middleware';

export type AppStates = {
  sideNavOpen: boolean;

  productsLinksOpen: boolean;
  bookingLinksOpen: boolean;

  setToggleState: (label: keyof Omit<AppStates, 'setAppState' | 'resetAppState' | 'setWholeAppState'>) => void;

  setAppState: (label: keyof Omit<AppStates, 'setAppState' | 'resetAppState' | 'setWholeAppState'>, value: any) => void;

  setWholeAppState: (appStates: Omit<AppStates, 'setAppState' | 'resetAppState' | 'setWholeAppState'>) => void;

  resetAppState: () => void;
};

const initState: Omit<AppStates, 'setAppState' | 'resetAppState' | 'setWholeAppState' | 'setToggleState'> = {
  sideNavOpen: true,

  productsLinksOpen: false,

  bookingLinksOpen: false,
};

const stateStore = devtools((set) => ({
  ...initState,

  setToggleState: (label) => {
    set((state) => {
      return {
        ...state,
        [`${label}`]: !state[label],
      };
    });
  },

  setAppState: (label, value) => set({ [`${label}`]: value }),

  setWholeAppState: (appStates) => set((current) => ({ ...current, ...appStates })),

  resetAppState: () => set({ ...initState }),
})) as StateCreator<AppStates, [], [], AppStates>;

export const useAppStore = create<AppStates>(stateStore);

const useAppStoreTrack = createTrackedSelector(useAppStore);

export default useAppStoreTrack;
