// app/screens/SettingsScreen.tsx
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import { useAssets } from 'expo-asset';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const menuItems = [
  { label: 'Saved Messages', icon: 'bookmark-outline' },
  { label: 'Recent Calls', icon: 'call-outline' },
  { label: 'Devices', icon: 'laptop-outline' },
  { label: 'Notifications', icon: 'notifications-outline' },
  { label: 'Appearance', icon: 'color-palette-outline' },
  { label: 'Language', icon: 'language-outline' },
  { label: 'Privacy & Security', icon: 'lock-closed-outline' },
  { label: 'Storage', icon: 'folder-outline' },
];

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const { data: session } = authClient.useSession();
  const [assets] = useAssets([require('@/assets/images/person-placeholder.png')]);

  const handleLogout = () => {
    authClient.signOut();
  };

  return (
    <ScrollView>
      <SafeAreaView className="mt-safe-offset-2 flex-1 p-4 py-8">
        {/* Header */}
        <View className="mt-safe items-center">
          <View className="relative">
            <Image
              source={assets ? { uri: assets[0].uri } : undefined}
              className="h-24 w-24 rounded-full bg-gray-200"
            />
          </View>
          <Text className="mt-3 text-lg font-semibold">{session?.user.name}</Text>
          <Text variant="muted">{session?.user.email}</Text>
        </View>

        {/* <View className="mt-6 flex-1">
          {menuItems.map((item, idx) => (
            <React.Fragment key={idx}>
              <Separator />
              <TouchableOpacity className="flex-row items-center justify-between px-6 py-4">
                <View className="flex-row items-center gap-2 space-x-4">
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={colorScheme === 'light' ? 'dark' : 'white'}
                  />
                  <Text className="text-base">{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="gray" />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View> */}

        <View className="items-center mt-4">
          <QRCode value={session?.user.id} size={200} />
        </View>

        {/* <TouchableOpacity
          onPress={handleLogout}
          className="mx-6 mb-20 mt-6 rounded-2xl bg-red-500 py-3">
          <Text className="text-center text-base font-semibold text-white">Log Out</Text>
        </TouchableOpacity> */}
      </SafeAreaView>
    </ScrollView>
  );
}
