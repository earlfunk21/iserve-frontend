import QRScanner from "@/components/scan-qrcode-referrer";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { scanFromURLAsync } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

type Mode = "choice" | "scan" | "manual";

export default function SetReferralScreen() {
  const { data: session, refetch } = authClient.useSession();
  const { referrerId } = useLocalSearchParams<{ referrerId?: string }>();

  // Moved above early returns to keep hooks order stable
  const [mode, setMode] = useState<Mode>("choice");
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [mediaPermission, requestMediaPermission] =
    ImagePicker.useMediaLibraryPermissions();

  useEffect(() => {
    if (!!session && !!referrerId) {
      authClient.updateUser({ referrerId: String(referrerId) });
    }
  }, [referrerId, session]);

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (session.user.referrerId) {
    return <Redirect href="/settings/update-profile" />;
  }

  // Select an image from the library and try to read a QR code from it
  const importFromGallery = async () => {
    setSelecting(true);
    if (!mediaPermission?.granted) {
      const perm = await requestMediaPermission();
      if (!perm.granted) {
        setSelecting(false);
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      setSelecting(false);
      return;
    }

    const uri = result.assets[0].uri;

    const scanResult = await scanFromURLAsync(uri, ["qr"]);

    const referralId = scanResult[0].data;

    router.setParams({ referrerId: referralId });
    setSelecting(false);
  };

  if (mode === "scan") {
    return <QRScanner onClose={() => setMode("choice")} />;
  }

  if (mode === "manual") {
    return (
      <View className="mt-safe flex-1 items-center justify-center gap-6 bg-white px-6 dark:bg-black">
        <View className="w-full max-w-md gap-3">
          <Text className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Import QR Code
          </Text>
          <View className="mt-2 flex-row items-center gap-3">
            <Button disabled={selecting} onPress={importFromGallery}>
              <Text>{selecting ? "Selecting..." : "Select QR"}</Text>
            </Button>
            <Button onPress={() => setMode("choice")}>
              <Text>Back</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // choice
  return (
    <View className="mt-safe flex-1 items-center justify-center gap-6 bg-white px-6 dark:bg-black">
      <View className="w-full max-w-md items-center gap-4">
        <Text className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Set your referral
        </Text>
        <Text className="text-center text-gray-600 dark:text-gray-300">
          Choose how you want to add your referrer. You can scan a QR code or
          import qr code manually.
        </Text>
        <View className="mt-2 w-full gap-3">
          <Button onPress={() => setMode("scan")}>
            <Text>Scan QR Code</Text>
          </Button>
          <Button onPress={() => setMode("manual")}>
            <Text>Import QR Code</Text>
          </Button>
          <Button
            onPress={() =>
              refetch({
                query: {
                  disableCookieCache: true,
                },
              })
            }
          >
            <Text>Refresh</Text>
          </Button>
          <TouchableOpacity
            onPress={() => authClient.signOut()}
            className="mx-6 mb-20 mt-6 rounded-2xl bg-red-500 py-3"
          >
            <Text className="text-center text-base font-semibold text-white">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
