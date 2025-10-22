import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { THEME } from "@/lib/theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CircleAlertIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";

export default function RoomLayout() {
  const { colorScheme } = useColorScheme();
  const { name } = useLocalSearchParams<{ name: string }>();

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
          headerTitleAlign: "center",
        }}
      />
    </Stack>
  );
}

function RoomSettings() {
  const router = useRouter();
  return (
    <Button
      onPressIn={() => {
        router.push("..");
      }}
      size="icon"
      variant="ghost"
      className="rounded-full"
    >
      <Icon as={CircleAlertIcon} className="size-5" />
    </Button>
  );
}
