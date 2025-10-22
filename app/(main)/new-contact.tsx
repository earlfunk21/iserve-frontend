import QRScanner from "@/components/scan-qrcode-referrer";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import api from "@/lib/api";
import { MyContact } from "@/types/core.types";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

type Mode = "choice" | "scan";

export default function NewContactScreen() {
  const { referrerId } = useLocalSearchParams<{ referrerId?: string }>();
  const mutation = useMutation({
    mutationFn: async ({ contactId }: { contactId: string }) => {
      const { data } = await api.patch(`/user/add-contact/${contactId}`);
      return data;
    },
    onSuccess: (data: MyContact) => {
      router.replace(`/new-message?name=${data.name}&id=${data.id}`);
    },
  });
  const router = useRouter();

  // Moved above early returns to keep hooks order stable
  const [mode, setMode] = useState<Mode>("choice");

  useEffect(() => {
    if (!!referrerId) {
      mutation.mutate({ contactId: referrerId });
    }
  }, [referrerId]);

  if (mode === "scan") {
    return <QRScanner onClose={() => setMode("choice")} />;
  }

  // choice
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-white px-6 dark:bg-black">
      <View className="w-full max-w-md items-center gap-4">
        <Text className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          New Contact
        </Text>
        <Text className="text-center text-gray-600 dark:text-gray-300">
          You can scan a QR code to add to your contacts.
        </Text>
        <View className="mt-2 w-full gap-3">
          <Button onPress={() => setMode("scan")}>
            <Text>Scan QR Code</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
