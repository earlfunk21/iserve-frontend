import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useMarkRoomAsRead } from "@/hooks/mark-room-as-read";
import { useGradualAnimation } from "@/hooks/use-gradual-animation";
import { Message, useMessages } from "@/hooks/use-messages";
import { MyRoomsKeys } from "@/hooks/use-my-rooms";
import useChatSocket from "@/hooks/use-new-message";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Send } from "lucide-react-native";
import { memo, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSWRConfig } from "swr";
import z from "zod";

export default function HomeScreen() {
  const { room } = useLocalSearchParams<{ room: string }>();
  const { data: messages, isLoading } = useMessages(room);
  const { data: session, isPending } = authClient.useSession();
  const { height } = useGradualAnimation();
  const { trigger } = useMarkRoomAsRead(room);
  const { mutate } = useSWRConfig();

  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      trigger();

      return () => {
        mutate(MyRoomsKeys);
      };
    }, [])
  );

  if (isLoading || isPending) {
    return (
      <View className="flex-1 bg-white dark:bg-black px-4 py-6">
        {Array.from({ length: 12 }).map((_, i) => {
          const isRight = i % 3 === 0;
          const widths = ["w-24", "w-40", "w-56", "w-32", "w-64", "w-48"];
          const w = widths[i % widths.length];
          return (
            <View
              key={i}
              className={cn("mb-4", isRight ? "items-end" : "items-start")}
            >
              {!isRight && (
                <Skeleton className="h-3 w-16 mb-2 rounded-md bg-gray-100 dark:bg-gray-900" />
              )}
              <Skeleton
                className={cn(
                  "h-10 rounded-2xl shadow-sm ring-1",
                  isRight
                    ? "bg-blue-500/80 rounded-tr-none ring-black/5"
                    : "bg-gray-100 rounded-tl-none dark:bg-gray-900 dark:ring-white/10",
                  w
                )}
              />
            </View>
          );
        })}
      </View>
    );
  }

  if (!session || !messages) {
    return null;
  }

  return (
    <View className="flex-1 px-2 mt-safe-offset-2">
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TextItem item={item} />}
        showsVerticalScrollIndicator={false}
        inverted
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
          paddingTop: 8,
        }}
      />
      <SendMessageInput roomId={room} />
      <Animated.View style={fakeView} />
    </View>
  );
}

export const formSchema = z.object({
  content: z.string().trim().min(1, "Type a message"),
  roomId: z.string(),
});

type SendMessageInputProps = {
  roomId: string;
};

const SendMessageInput = memo(({ roomId }: SendMessageInputProps) => {
  const { control, handleSubmit, reset, watch } = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      roomId: roomId,
    },
  });
  const { mutate } = useSWRConfig();
  const { socket } = useChatSocket();
  const { data: session } = authClient.useSession();

  if (!session) {
    return null;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const trimmed = values.content.trim();
    if (!trimmed) return;

    socket?.emit("sendMessage", { ...values, content: trimmed });
    const optimisticMessage: Message = {
      content: trimmed,
      id: `optimistic-${Date.now()}`,
      sender: {
        id: session.user.id,
        name: session.user.name,
      },
      createdAt: new Date(),
    };
    mutate(
      `/chat/room/${roomId}/messages`,
      (currentMessages: Message[] = []) => [
        optimisticMessage,
        ...currentMessages,
      ],
      { revalidate: true }
    );
    reset({ content: "", roomId });
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
});

// Helpers: format time and initials for better UI polish
function formatTime(input?: string | number | Date) {
  if (!input) return "";
  const d = new Date(input);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const diff = now.getTime() - d.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (diff < 7 * oneDay) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const TextItem = memo(({ item }: { item: Message }) => {
  const { data: session } = authClient.useSession();
  const isMe = item.sender.id === session?.user.id;

  return (
    <View className={cn("mb-3 px-2", isMe ? "items-end" : "items-start")}>
      {!isMe && (
        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2 mb-1">
          {item.sender.name}
        </Text>
      )}

      <View
        className={cn(
          "px-4 py-2 rounded-2xl max-w-[80%] shadow-sm ring-1 ring-black/5 dark:ring-white/10",
          isMe
            ? "bg-blue-500 rounded-tr-none"
            : "bg-gray-100 rounded-tl-none dark:bg-gray-900"
        )}
      >
        <Text
          className={cn(
            isMe ? "text-white" : "text-gray-900 dark:text-gray-100"
          )}
        >
          {item.content}
        </Text>
      </View>

      <Text
        className={cn(
          "mt-1 text-[10px] text-gray-500 dark:text-gray-400",
          isMe ? "mr-3" : "ml-3"
        )}
      >
        {formatTime(item.createdAt)}
      </Text>
    </View>
  );
});
