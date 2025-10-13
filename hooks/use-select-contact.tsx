"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type SelectContactContextValue = {
  selectedId: string | null;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  select: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
};

const SelectContactContext = createContext<
  SelectContactContextValue | undefined
>(undefined);

type ProviderProps = {
  children: ReactNode;
  initialSelectedId?: string | null;
};

export function SelectContactProvider({
  children,
  initialSelectedId = null,
}: ProviderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId
  );

  const select = useCallback((id: string) => setSelectedId(id), []);
  const clear = useCallback(() => setSelectedId(null), []);
  const isSelected = useCallback(
    (id: string) => selectedId === id,
    [selectedId]
  );

  const value = useMemo(
    () => ({ selectedId, setSelectedId, select, clear, isSelected }),
    [selectedId, select, clear, isSelected]
  );

  return (
    <SelectContactContext.Provider value={value}>
      {children}
    </SelectContactContext.Provider>
  );
}

export function useSelectContact(): SelectContactContextValue {
  const ctx = useContext(SelectContactContext);
  if (!ctx) {
    throw new Error(
      "useSelectContact must be used within a SelectContactProvider"
    );
  }
  return ctx;
}
