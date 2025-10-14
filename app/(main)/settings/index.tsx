// app/screens/SettingsScreen.tsx
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { useAssets } from "expo-asset";
import { Link } from "expo-router";
import {
  ChevronRight,
  QrCodeIcon,
  SunMoon,
  UserPenIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { data: session } = authClient.useSession();
  const [assets] = useAssets([
    require("@/assets/images/person-placeholder.png"),
  ]);

  return (
    <ScrollView>
      <SafeAreaView className="mt-safe-offset-2 flex-1 p-4 py-8">
        {/* Header */}
        <View className="mt-safe items-center">
          <View className="relative">
            <Image
              source={assets ? { uri: assets[0].uri } : undefined}
              className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700"
            />
          </View>
          <Text className="mt-3 text-lg font-semibold">
            {session?.user.name}
          </Text>
          <Text variant="muted">{session?.user.email}</Text>
        </View>

        <View className="mt-6 flex-1">
          <Separator />
          <View className="flex-row items-center justify-between px-6 py-4">
            <View className="flex-row items-center gap-2 space-x-4">
              <Icon as={SunMoon} size={22} />
              <Text className="text-base">Dark mode</Text>
            </View>
            <Switch
              checked={colorScheme === "dark"}
              onCheckedChange={toggleColorScheme}
              className="bg-primary/50 dark:bg-primary"
            />
          </View>
          <Separator />
          <Link href="/settings/update-profile" asChild>
            <TouchableOpacity className="flex-row items-center justify-between px-6 py-4">
              <View className="flex-row items-center gap-2 space-x-4">
                <Icon as={UserPenIcon} size={22} />
                <Text className="text-base">Update Profile</Text>
              </View>
              <Icon as={ChevronRight} size={20} />
            </TouchableOpacity>
          </Link>
          <Separator />
          <Link href="/settings/qrcode" asChild>
            <TouchableOpacity className="flex-row items-center justify-between px-6 py-4">
              <View className="flex-row items-center gap-2 space-x-4">
                <Icon as={QrCodeIcon} size={22} />
                <Text className="text-base">QRcode</Text>
              </View>
              <Icon as={ChevronRight} size={20} />
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
