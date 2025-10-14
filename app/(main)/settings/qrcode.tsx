// app/screens/SettingsScreen.tsx
import { authClient } from "@/lib/auth-client";
import { useColorScheme } from "nativewind";
import React from "react";
import { ScrollView, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const { data: session } = authClient.useSession();

  return (
    <ScrollView>
      <SafeAreaView className="mt-safe-offset-2 flex-1 p-4 py-8">
        <View className="items-center mt-4">
          <QRCode
            value={session?.user.id ?? ""}
            size={200}
            color={colorScheme === "dark" ? "#ffffff" : "#000000"}
            backgroundColor="transparent"
          />
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
