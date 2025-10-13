import NewMessage from "@/components/new-message";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { authClient } from "@/lib/auth-client";
import { THEME } from "@/lib/theme";
import { Redirect, Stack, useRouter } from "expo-router";
import { Settings2, SquarePenIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";

export default function MainLayout() {
  const { data: session, isPending } = authClient.useSession();
  const { colorScheme } = useColorScheme();

  if (isPending) {
    return null;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (!session.user.referrerId) {
    return <Redirect href="/set-referral" />;
  }

  return (
    <>
      <NewMessage session={session.session} />
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
            title: "Chats",
            headerTransparent: true,
            headerRight: () => <HeaderRight />,
            headerTitleStyle: {
              fontSize: 32,
              fontWeight: "bold",
            },
            headerTitleAlign: "left",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            headerTransparent: true,
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="[room]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="new-message"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

function HeaderRight() {
  const router = useRouter();

  return (
    <View className="flex-row">
      <Button
        onPress={() => {
          router.navigate("/new-message");
        }}
        size="icon"
        variant="ghost"
        className="rounded-full"
        accessibilityLabel="New conversation"
      >
        <Icon as={SquarePenIcon} className="size-5" />
      </Button>
      <Button
        onPress={() => {
          router.navigate("/settings");
        }}
        size="icon"
        variant="ghost"
        className="rounded-full"
        accessibilityLabel="New conversation"
      >
        <Icon as={Settings2} className="size-5" />
      </Button>
    </View>
  );
}
