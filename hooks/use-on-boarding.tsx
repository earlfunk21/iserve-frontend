import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingStore {
  onboarded: boolean;
  loading: boolean;
  onboard: () => Promise<void>;
}

export const useOnboardStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      onboarded: false,
      loading: false,
      onboard: async () => {
        set({ loading: true });
        try {
          await AsyncStorage.setItem('onboarded', 'true');
          set({ onboarded: true, loading: false });
        } catch (e) {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'onboard1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
