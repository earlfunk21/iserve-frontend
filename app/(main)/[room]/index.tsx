import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { useGradualAnimation } from "@/hooks/use-gradual-animation";
import { useMarkRoomAsRead } from "@/hooks/use-mark-room-as-read";
import { Message, useMessages } from "@/hooks/use-messages";
import { MyRoomsKeys } from "@/hooks/use-my-rooms";
import { usePrivateKeyStore } from "@/hooks/use-private-key";
import {
  RoomParticipants,
  useRoomParticipants,
} from "@/hooks/use-room-participants";
import { useSendMessage } from "@/hooks/use-send-message";
import { authClient, User } from "@/lib/auth-client";
import { decryptEnvelope, encryptForRecipients } from "@/lib/crypto";
import { cn, formatTime } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Send } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSWRConfig } from "swr";
import z from "zod";

export default function HomeScreen() {
  const { room } = useLocalSearchParams<{ room: string }>();
  const {
    data: encryptedMessages,
    isLoading,
    mutate: mutateMessages,
  } = useMessages(room);
  const { data: session, isPending } = authClient.useSession();
  const { height } = useGradualAnimation();
  const { trigger } = useMarkRoomAsRead(room);
  const { mutate } = useSWRConfig();
  const headerHeight = useHeaderHeight();
  const { data: roomParticipants, isLoading: isLoadingRoomParticipants } =
    useRoomParticipants(room);
  const { privateKey } = usePrivateKeyStore();
  const [messages, setMessages] = useState<Message[]>([]);

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

  useEffect(() => {
    if (
      !!session &&
      !!encryptedMessages &&
      !!roomParticipants &&
      !!privateKey
    ) {
      getDecryptedMessages();
    }
  }, [session, encryptedMessages, roomParticipants, privateKey]);

  if (isLoading || isPending || isLoadingRoomParticipants) {
    return (
      <View
        className="flex-1 bg-white dark:bg-black px-4 py-6"
        style={{ paddingTop: headerHeight }}
      >
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
                  "h-10 rounded-2xl shadow-sm",
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

  if (!session || !encryptedMessages || !roomParticipants || !privateKey) {
    return null;
  }

  const getDecryptedMessages = async () => {
    const decryptedMessages = await Promise.all(
      encryptedMessages.map(async (message) => {
        const decrypted = await decryptEnvelope(JSON.parse(message.content), {
          publicKey: session.user.publicKey,
          secretKey: privateKey,
        });

        return {
          ...message,
          content: decrypted.plaintext,
        };
      })
    );
    setMessages(decryptedMessages);
  };

  return (
    <View className="flex-1" style={{ paddingTop: headerHeight }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TextItem item={item} user={session.user} />}
        showsVerticalScrollIndicator={false}
        inverted
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
      />
      <SendMessageInput
        roomId={room}
        mutateMessages={mutateMessages}
        roomParticipants={roomParticipants}
        privateKey={privateKey}
      />
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
  mutateMessages: (
    data?:
      | Message[]
      | Promise<Message[] | undefined>
      | ((
          currentData?: Message[]
        ) => Message[] | Promise<Message[] | undefined>),
    opts?: any
  ) => Promise<Message[] | undefined>;
  roomParticipants: RoomParticipants;
  privateKey: string;
};

const SendMessageInput = memo(
  ({
    roomId,
    mutateMessages,
    roomParticipants,
    privateKey,
  }: SendMessageInputProps) => {
    const { control, handleSubmit, reset, watch } = useForm<
      z.infer<typeof formSchema>
    >({
      resolver: zodResolver(formSchema),
      defaultValues: {
        content: "",
        roomId: roomId,
      },
    });
    const { data: session } = authClient.useSession();
    const { trigger } = useSendMessage();

    if (!session) {
      return null;
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
      const trimmed = values.content.trim();
      if (!trimmed) return;

      const publicKeys =
        roomParticipants.participants.map((p) => p.publicKey) || [];

      const armoredContent = await encryptForRecipients(
        trimmed,
        {
          publicKey: session.user.publicKey,
          secretKey: privateKey,
        },
        publicKeys
      );

      const optimisticMessage: Message = {
        content: JSON.stringify(armoredContent),
        id: `optimistic-${Date.now()}`,
        sender: {
          id: session.user.id,
          name: session.user.name,
          publicKey: session.user.publicKey,
        },
        createdAt: new Date(),
      };

      mutateMessages(
        (current: Message[] = []) => [optimisticMessage, ...current],
        false
      );

      trigger(
        { content: JSON.stringify(armoredContent), roomId },
        {
          onError: () => {
            mutateMessages(
              (current = []) =>
                current.filter((m) => m.id !== optimisticMessage.id),
              false
            );
          },
          onSuccess: () => {
            mutateMessages();
          },
        }
      );

      reset({ content: "", roomId });
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
  }
);

type TextItemProps = {
  item: Message;
  user: User;
};

const TextItem = memo(({ item, user }: TextItemProps) => {
  const isMe = item.sender.id === user.id;

  return (
    <View className={cn("mb-3 px-2", isMe ? "items-end" : "items-start")}>
      {!isMe && (
        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2 mb-1">
          {item.sender.name}
        </Text>
      )}

      <View
        className={cn(
          "px-4 py-2 rounded-2xl max-w-[80%] shadow-sm",
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
