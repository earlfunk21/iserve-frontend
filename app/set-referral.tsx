import QRScanner from "@/components/scan-qrcode-referrer";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

type Mode = "choice" | "scan" | "manual";

export default function SetReferralScreen() {
  const { data: session, refetch } = authClient.useSession();
  const { referrerId } = useLocalSearchParams<{ referrerId?: string }>();

  // Moved above early returns to keep hooks order stable
  const [mode, setMode] = useState<Mode>("choice");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const submitManual = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      setSubmitting(true);
      await authClient.updateUser({ referrerId: trimmed });
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "scan") {
    return <QRScanner onClose={() => setMode("choice")} />;
  }

  if (mode === "manual") {
    return (
      <View className="mt-safe flex-1 items-center justify-center gap-6 bg-white px-6 dark:bg-black">
        <View className="w-full max-w-md gap-3">
          <Text className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Enter referral code
          </Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="e.g. ABC123"
            className="rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-black dark:text-gray-100"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <View className="mt-2 flex-row items-center gap-3">
            <Button
              disabled={submitting || !code.trim()}
              onPress={submitManual}
            >
              <Text>{submitting ? "Submitting..." : "Submit"}</Text>
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
          enter the code manually.
        </Text>
        <View className="mt-2 w-full gap-3">
          <Button onPress={() => setMode("scan")}>
            <Text>Scan QR Code</Text>
          </Button>
          <Button onPress={() => setMode("manual")}>
            <Text>Enter Code Manually</Text>
          </Button>
          <Button onPress={() => refetch()}>
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
