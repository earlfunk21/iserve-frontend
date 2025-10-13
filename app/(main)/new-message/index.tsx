import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useGradualAnimation } from "@/hooks/use-gradual-animation";
import { MyRooms } from "@/hooks/use-my-rooms";
import { useSendPrivateMessage } from "@/hooks/use-send-private-message";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHeaderHeight } from "@react-navigation/elements";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Send } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import z from "zod";

export default function NewMessageScreen() {
  const { name, id } = useLocalSearchParams<{ name: string; id?: string }>();
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
      <SendMessageInput userId={id} />
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
};

const SendMessageInput = ({ userId }: SendMessageInputProps) => {
  const { control, handleSubmit, watch } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      userId: userId,
    },
  });
  const { trigger } = useSendPrivateMessage();
  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const trimmed = values.content.trim();
    if (!trimmed) return;

    trigger(
      {
        content: trimmed,
        receiver: userId,
      },
      {
        onSuccess: async ({ data }: { data: MyRooms }) => {
          const { id, participants } = data;
          router.replace(`/${id}?name=${participants?.[0]?.name ?? "Unknown"}`);
        },
      }
    );
  };

  const contentValue = watch("content");
  const canSend = (contentValue?.trim().length ?? 0) > 0;

  return (
    <View className="px-3 pb-4 pt-2">
      <View className="flex-row items-center">
        <Controller
          control={control}
          name="content"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              className="flex-1 rounded-full px-4 bg-gray-100 dark:bg-gray-900"
              placeholder="Type a message…"
              autoCapitalize="sentences"
              onSubmitEditing={handleSubmit(onSubmit)}
              returnKeyType="send"
              submitBehavior="submit"
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
