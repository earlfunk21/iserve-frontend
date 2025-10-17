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
import { memo, useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { ViewToken } from "react-native";
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
  const { data: session } = authClient.useSession();
  const { height } = useGradualAnimation();
  const { trigger } = useMarkRoomAsRead(room);
  const { mutate } = useSWRConfig();
  const headerHeight = useHeaderHeight();
  const { data: roomParticipants } = useRoomParticipants(room);
  const { privateKey } = usePrivateKeyStore();
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});

  const keyExtractor = useCallback((item: Message) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      if (!session?.user) return null;
      return (
        <TextItem
          item={item}
          user={session.user}
          decryptedContent={decryptedMap[item.id]}
        />
      );
    },
    [session?.user, decryptedMap]
  );

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

  const decryptVisible = useCallback(
    async (items: Message[]) => {
      if (!session?.user || !privateKey) return;

      const toDecrypt = items.filter((m) => !decryptedMap[m.id]);
      if (toDecrypt.length === 0) return;

      try {
        const results = await Promise.all(
          toDecrypt.map(async (msg) => {
            const decrypted = await decryptEnvelope(msg.content, {
              publicKey: session.user!.publicKey,
              secretKey: privateKey,
            });
            return { id: msg.id, decrypted } as const;
          })
        );

        setDecryptedMap((prev) => {
          const next = { ...prev };
          for (const r of results) next[r.id] = r.decrypted;
          return next;
        });
      } catch (e) {
        // Swallow individual decrypt errors; leave message as pending
      }
    },
    [session?.user, privateKey, decryptedMap]
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const items: Message[] = viewableItems
        .map((v) => v.item as Message)
        .filter(Boolean);
      if (items.length) decryptVisible(items);
    },
    [decryptVisible]
  );

  return (
    <View className="flex-1" style={{ paddingTop: headerHeight }}>
      <FlatList
        data={encryptedMessages || []}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        inverted
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={15}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 25 }}
        ListEmptyComponent={
          <View className="bg-white dark:bg-black px-4 py-6">
            {Array.from({ length: 10 }).map((_, i) => {
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
        }
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
      />
      {!!session && !!privateKey && !!roomParticipants ? (
        <SendMessageInput
          roomId={room}
          mutateMessages={mutateMessages}
          roomParticipants={roomParticipants}
          privateKey={privateKey}
          user={session.user}
          onOptimisticMessage={(id, content) =>
            setDecryptedMap((prev) => ({ ...prev, [id]: content }))
          }
        />
      ) : null}
      <Animated.View pointerEvents="none" style={fakeView} />
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
  user: User;
  onOptimisticMessage: (id: string, content: string) => void;
};

const SendMessageInput = memo(
  ({
    roomId,
    mutateMessages,
    roomParticipants,
    privateKey,
    user,
    onOptimisticMessage,
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
    const { trigger } = useSendMessage();

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
      const trimmed = values.content.trim();
      if (!trimmed) return;

      const publicKeys = roomParticipants.participants.map((p) => p.publicKey);

      const armoredContent = await encryptForRecipients(
        trimmed,
        {
          publicKey: user.publicKey,
          secretKey: privateKey,
        },
        publicKeys
      );

      const optimisticMessage: Message = {
        content: JSON.stringify(armoredContent),
        id: `optimistic-${Date.now()}`,
        sender: {
          id: user.id,
          name: user.name,
          publicKey: user.publicKey,
        },
        createdAt: new Date(),
      };

      mutateMessages(
        (current: Message[] = []) => [optimisticMessage, ...current],
        false
      );

      // Seed decrypted cache so the optimistic message renders immediately
      onOptimisticMessage(optimisticMessage.id, trimmed);

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
      () => (contentValue?.trim().length ?? 0) > 0 && !!roomParticipants,
      [contentValue, roomParticipants]
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
  decryptedContent?: string;
};

const TextItem = memo(
  ({ item, user, decryptedContent }: TextItemProps) => {
    const isMe = item.sender.id === user.id;
    const timeText = useMemo(
      () => formatTime(item.createdAt),
      [item.createdAt]
    );

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
              : "bg-gray-100 rounded-tl-none dark:bg-gray-900",
            !decryptedContent && "w-24"
          )}
        >
          <Text
            className={cn(
              isMe ? "text-white" : "text-gray-900 dark:text-gray-100"
            )}
          >
            {decryptedContent}
          </Text>
        </View>

        <Text
          className={cn(
            "mt-1 text-[10px] text-gray-500 dark:text-gray-400",
            isMe ? "mr-3" : "ml-3"
          )}
        >
          {timeText}
        </Text>
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.user.id === next.user.id &&
      prev.item.id === next.item.id &&
      prev.decryptedContent === next.decryptedContent &&
      Number(new Date(prev.item.createdAt)) ===
        Number(new Date(next.item.createdAt)) &&
      prev.item.sender.id === next.item.sender.id &&
      prev.item.sender.name === next.item.sender.name
    );
  }
);
