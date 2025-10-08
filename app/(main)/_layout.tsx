import NewMessage from "@/components/new-message";
import { authClient } from "@/lib/auth-client";
import { Redirect, Slot } from "expo-router";
import React from "react";

export default function MainLayout() {
  const { data: session } = authClient.useSession();

  if (session?.session.expiresAt && session?.session.expiresAt < new Date()) {
    authClient.signOut();
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
