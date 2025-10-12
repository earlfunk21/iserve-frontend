import NewMessage from "@/components/new-message";
import { authClient } from "@/lib/auth-client";
import { Redirect, Slot } from "expo-router";
import React from "react";

export default function MainLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <>
      <NewMessage session={session.session} />
      <Slot />
    </>
  );
}
