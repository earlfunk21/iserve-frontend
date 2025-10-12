import { useOnboardStore } from "@/hooks/use-on-boarding";
import { Redirect, Slot } from "expo-router";
import React from "react";

export default function SignInLayout() {
  const { onboarded } = useOnboardStore();

  if (!onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Slot />;
}
