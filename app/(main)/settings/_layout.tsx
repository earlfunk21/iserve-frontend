import { THEME } from "@/lib/theme";
import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";

export default function MainLayout() {
  const { colorScheme } = useColorScheme();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor:
            colorScheme === "light"
              ? THEME.light.background
              : THEME.dark.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="qrcode"
        options={{
          title: "QR Code",
        }}
      />
      <Stack.Screen
        name="update-profile"
        options={{
          title: "Update Profile",
        }}
      />
    </Stack>
  );
}
