import { SelectContactProvider } from "@/hooks/use-select-contact";
import { Stack } from "expo-router";

export default function NewMessageLayout() {
  return (
    <SelectContactProvider>
      <Stack />
    </SelectContactProvider>
  );
}
