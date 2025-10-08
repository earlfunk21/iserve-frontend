import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { PlatformPressable } from "@react-navigation/elements";
import { Tabs } from "expo-router";
import { SquarePenIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";

export default function MainLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "blue",
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            android_ripple={{ color: "#D3D3D320", radius: 80 }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          headerTransparent: true,
          headerShadowVisible: true,
          headerStyle: {
            backgroundColor:
              colorScheme === "light"
                ? THEME.light.background
                : THEME.dark.background,
          },
          headerRight: () => <NewConversation />,
          headerLeft: () => <EditChats />,
          headerTitleAlign: "center",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerTransparent: true,
          headerShadowVisible: true,
          headerStyle: {
            backgroundColor:
              colorScheme === "light"
                ? THEME.light.background
                : THEME.dark.background,
          },
          headerTitleAlign: "center",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-sharp" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function NewConversation() {
  return (
    <Button
      onPressIn={() => {
        // Navigate to the new conversation screen
      }}
      size="icon"
      variant="ghost"
      className="rounded-full"
    >
      <Icon as={SquarePenIcon} className="size-5" />
    </Button>
  );
}

function EditChats() {
  return (
    <Button
      onPressIn={() => {
        // Navigate to the new conversation screen
      }}
      variant="ghost"
      className="rounded-full"
    >
      <Text>Edit</Text>
    </Button>
  );
}
