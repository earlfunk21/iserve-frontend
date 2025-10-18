import { MessageItem } from "@/components/message-item";
import { SendPrivateMessageInput } from "@/components/send-private-message-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGradualAnimation } from "@/hooks/use-gradual-animation";
import { useMarkRoomAsRead } from "@/hooks/use-mark-room-as-read";
import { Message, useMessages } from "@/hooks/use-messages";
import { MyRoomsKeys } from "@/hooks/use-my-rooms";
import { usePrivateKeyStore } from "@/hooks/use-private-key";
import { useRoomParticipants } from "@/hooks/use-room-participants";
import { authClient } from "@/lib/auth-client";
import { decryptEnvelope } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import type { ViewToken } from "react-native";
import { FlatList, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSWRConfig } from "swr";

export default function HomeScreen() {
  const { room } = useLocalSearchParams<{ room: string }>();
  const { data: encryptedMessages } = useMessages(room);
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
        <MessageItem
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
      {!!session && !!privateKey && !!roomParticipants && (
        <SendPrivateMessageInput
          roomId={room}
          roomParticipants={roomParticipants}
          privateKey={privateKey}
          user={session.user}
          onOptimisticMessage={(id, content) =>
            setDecryptedMap((prev) => ({ ...prev, [id]: content }))
          }
        />
      )}
      <Animated.View pointerEvents="none" style={fakeView} />
    </View>
  );
}
