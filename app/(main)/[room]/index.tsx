import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useMarkRoomAsRead } from "@/hooks/mark-room-as-read";
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
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSWRConfig } from "swr";
import z from "zod";

const useGradualAnimation = () => {
  const height = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: (event) => {
        "worklet";
        height.value = Math.max(event.height, 0);
      },
    },
    []
  );
  return { height };
};

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

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isMe = item.sender.id === session?.user.id;

      return (
        <View className={cn("mb-3", isMe ? "items-end" : "items-start")}>
          {!isMe && (
            <Text className="text-xs text-gray-500 ml-2 mb-1">
              {item.sender.name}
            </Text>
          )}

          <View
            className={cn(
              "px-4 py-2 rounded-2xl max-w-[80%]",
              isMe
                ? "bg-blue-500 rounded-tr-none"
                : "bg-gray-100 rounded-tl-none dark:bg-gray-900"
            )}
          >
            <Text>{item.content}</Text>
          </View>
        </View>
      );
    },
    [session]
  );

  if (isLoading || isPending) {
    return (
      <View className="flex-1 px-4 py-6 space-y-5">
        <Skeleton className="h-8 w-20 mb-2 rounded-md bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="h-8 w-48 rounded-2xl bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="self-start h-8 w-56 rounded-2xl mt-3 mb-3 bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="self-end h-8 w-32 rounded-2xl mt-3 bg-blue-500 rounded-tr-none" />
        <Skeleton className="self-end h-8 w-64 rounded-2xl mt-3 bg-blue-500 rounded-tr-none" />
        <Skeleton className="self-start h-8 w-72 rounded-2xl mt-3 mb-3 bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="h-8 w-20 mb-2 rounded-md bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="h-8 w-48 rounded-2xl bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="self-start h-8 w-56 rounded-2xl mt-3 bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="self-end h-8 w-32 rounded-2xl mt-3 bg-blue-500 rounded-tr-none" />
        <Skeleton className="self-end h-8 w-64 rounded-2xl mt-3 bg-blue-500 rounded-tr-none" />
        <Skeleton className="self-start h-8 w-72 rounded-2xl mt-3 mb-3 bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="h-8 w-20 mb-2 rounded-md bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="h-8 w-48 rounded-2xl bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="self-start h-8 w-56 rounded-2xl mt-3 bg-gray-100 rounded-tl-none dark:bg-gray-900" />
        <Skeleton className="self-end h-8 w-32 rounded-2xl mt-3 bg-blue-500 rounded-tr-none" />
        <Skeleton className="self-end h-8 w-64 rounded-2xl mt-3 bg-blue-500 rounded-tr-none" />
        <Skeleton className="self-start h-8 w-72 rounded-2xl mt-3 mb-3 bg-gray-100 rounded-tl-none dark:bg-gray-900" />
      </View>
    );
  }

  if (!session || !messages) {
    return null;
  }

  return (
    <View className="flex-1 px-2">
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        inverted
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
      />
      <SendMessageInput roomId={room} />
      <Animated.View style={fakeView} />
    </View>
  );
}

export const formSchema = z.object({
  content: z.string(),
  roomId: z.string(),
});

type SendMessageInputProps = {
  roomId: string;
};

const SendMessageInput = memo(({ roomId }: SendMessageInputProps) => {
  const { control, handleSubmit, reset } = useForm<z.infer<typeof formSchema>>({
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
    socket?.emit("sendMessage", values);
    const optimisticMessage: Message = {
      content: values.content,
      id: "",
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
      {
        revalidate: true,
      }
    );
    reset();
  };

  return (
    <View className="flex-row items-center px-4 py-3">
      <Controller
        control={control}
        name="content"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            className="flex-1 rounded-full px-4 py-2"
            placeholder="Type a message..."
            autoCapitalize="words"
            onSubmitEditing={handleSubmit(onSubmit)}
            returnKeyType="send"
            submitBehavior="submit"
          />
        )}
      />
      <TouchableOpacity
        className="ml-2 bg-blue-500 rounded-full p-2"
        activeOpacity={0.8}
        onPress={handleSubmit(onSubmit)}
      >
        <Send size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
});
