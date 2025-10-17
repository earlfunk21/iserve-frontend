import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PrivatekeyStore {
  privateKey: string | null;
  setPrivateKey: (privateKey: string) => Promise<void>;
}

export const usePrivateKeyStore = create<PrivatekeyStore>()(
  persist(
    (set) => ({
      privateKey: null,
      setPrivateKey: async (privateKey: string) => {
        set({ privateKey });
      },
    }),
    {
      name: "privateKey",
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          return SecureStore.getItemAsync(name);
        },
        setItem: (name: string, value: string) => {
          return SecureStore.setItemAsync(name, value);
        },
        removeItem: (name: string) => {
          return SecureStore.deleteItemAsync(name);
        },
      })),
    }
  )
);
