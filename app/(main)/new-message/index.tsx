import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { useGradualAnimation } from "@/hooks/use-gradual-animation";
import { usePrivateKeyStore } from "@/hooks/use-private-key";
import api from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { encryptForRecipients } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHeaderHeight } from "@react-navigation/elements";
import { useMutation } from "@tanstack/react-query";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Send } from "lucide-react-native";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import z from "zod";

export default function NewMessageScreen() {
  const { name, id, publicKey } = useLocalSearchParams<{
    name: string;
    id?: string;
    publicKey: string;
  }>();
  const headerHeight = useHeaderHeight();
  const { height } = useGradualAnimation();

  if (!id) {
    return <Redirect href={`/new-message/select-contact`} withAnchor />;
  }

  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 px-2" style={{ paddingTop: headerHeight }}>
      <Stack.Screen options={{ title: name }} />
      <View className="flex-1 items-center">
        <Text variant="lead" className="text-muted-foreground">
          New message
        </Text>
        <Text className="mt-1 px-4 text-center text-sm text-muted-foreground">
          Start a private conversation with {name ?? "this contact"}.
        </Text>
      </View>
      <SendMessageInput userId={id} publicKey={publicKey} />
      <Animated.View style={fakeView} />
    </SafeAreaView>
  );
}

export const formSchema = z.object({
  content: z.string().trim().min(1, "Type a message"),
  userId: z.string(),
});

type SendMessageInputProps = {
  userId: string;
  publicKey: string;
};

const SendMessageInput = ({ userId, publicKey }: SendMessageInputProps) => {
  const { control, handleSubmit, watch } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      userId: userId,
    },
  });
  const mutation = useMutation({
    mutationFn: async (values: {
      content: string;
      userId: string;
    }): Promise<{
      id: string;
      participants: [{ user: { name: string } }];
    }> => {
      if (!session || !privateKey) {
        throw new Error("Not authenticated or no private key");
      }

      const publicKeys = [session.user.publicKey, publicKey];

      const armoredContent = await encryptForRecipients(
        values.content,
        {
          publicKey: session.user.publicKey,
          secretKey: privateKey,
        },
        publicKeys
      );
      const { data } = await api.post(`/chat/send-private-message`, {
        content: armoredContent,
        receiver: values.userId,
      });

      return data;
    },
    onSuccess: async (data) => {
      const { id, participants } = data;
      router.replace(`/${id}?name=${participants?.[0].user.name ?? "Unknown"}`);
    },
  });
  const router = useRouter();
  const { privateKey } = usePrivateKeyStore();
  const { data: session } = authClient.useSession();

  if (!session || !privateKey) {
    return null;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const trimmed = values.content.trim();
    if (!trimmed) return;

    await mutation.mutateAsync({
      content: trimmed,
      userId: values.userId,
    });
  };

  const contentValue = watch("content");
  const canSend = useMemo(
    () => (contentValue?.trim().length ?? 0) > 0,
    [contentValue]
  );

  return (
    <View className="px-3 pb-4 pt-2">
      <View className="flex-row items-end">
        <Controller
          control={control}
          name="content"
          render={({ field: { onChange, onBlur, value } }) => (
            <Textarea
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              className="flex-1 rounded-2xl px-4 bg-gray-100 dark:bg-gray-900 pt-2 placeholder:text-primary-foreground"
              placeholder="Type a message…"
            />
          )}
        />
        <TouchableOpacity
          className={cn(
            "ml-2 rounded-full p-3 shadow-sm",
            canSend ? "bg-blue-500 active:opacity-90" : "bg-blue-500/50"
          )}
          activeOpacity={0.8}
          onPress={handleSubmit(onSubmit)}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
