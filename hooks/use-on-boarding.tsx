import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface OnboardingStore {
  onboarded: boolean;
  onboard: () => Promise<void>;
}

export const useOnboardStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      onboarded: false,
      onboard: async () => {
        set({ onboarded: true });
      },
    }),
    {
      name: "onboard",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
