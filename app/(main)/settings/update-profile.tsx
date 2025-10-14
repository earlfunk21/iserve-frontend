// app/screens/SettingsScreen.tsx
import UpdateProfileForm from "@/components/update-profile-form";
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UpdateProfileScreen() {
  return (
    <ScrollView>
      <SafeAreaView className="mt-safe-offset-2 flex-1 p-4 py-8">
        <View className="mt-8">
          <UpdateProfileForm />
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
