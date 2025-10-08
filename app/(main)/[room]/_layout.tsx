import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { THEME } from "@/lib/theme";
import { HeaderBackButton } from "@react-navigation/elements";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CircleAlertIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";

export default function RoomLayout() {
  const { colorScheme } = useColorScheme();
  const { name } = useLocalSearchParams<{ room: string, name: string }>();
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: name,
          headerTransparent: true,
          headerShadowVisible: true,
          headerStyle: {
            backgroundColor:
              colorScheme === "light"
                ? THEME.light.background
                : THEME.dark.background,
          },
          headerRight: () => <RoomSettings />,
          headerLeft: () => (
            <HeaderBackButton
              tintColor={
                colorScheme === "light"
                  ? THEME.light.primary
                  : THEME.dark.primary
              }
              onPress={() => {
                router.push("..");
              }}
            />
          ),
          headerTitleAlign: "center",
        }}
      />
    </Stack>
  );
}

function RoomSettings() {
  return (
    <Button
      onPressIn={() => {
        // Navigate to the new conversation screen
      }}
      size="icon"
      variant="ghost"
      className="rounded-full"
    >
      <Icon as={CircleAlertIcon} className="size-5" />
    </Button>
  );
}
