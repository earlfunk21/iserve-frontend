import { MessageItem } from "@/components/message-item";
import { SendPrivateMessageInput } from "@/components/send-private-message-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGradualAnimation } from "@/hooks/use-gradual-animation";
import { usePrivateKeyStore } from "@/hooks/use-private-key";
import api from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { decryptEnvelope } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import { Message } from "@/types/core.types";
import { Paginate } from "@/types/paginate.type";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { FlatList, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

export default function HomeScreen() {
  const { room } = useLocalSearchParams<{ room: string }>();
  const { data: session } = authClient.useSession();
  const { height } = useGradualAnimation();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const { data: roomUsers } = useQuery({
    queryKey: ["roomUsers", room],
    queryFn: async () => {
      const { data } = await api.get(`/chat/room/${room}/users`);

      return data;
    },
  });
  const { privateKey } = usePrivateKeyStore();
  const { data, hasNextPage, fetchNextPage, isFetching } = useInfiniteQuery({
    queryKey: ["room", room],
    queryFn: async ({ pageParam }): Promise<Paginate<Message>> => {
      const { data } = await api.get<Paginate<Message>>(
        `/chat/room/${room}/messages?page=${pageParam}`
      );

      const encryptedMessages = data[0];

      if (!session?.user || !privateKey) {
        throw Error("Not authenticated or no private key");
      }

      const decryptedMessages = await Promise.all(
        encryptedMessages.map(async (msg) => {
          try {
            const decrypted = await decryptEnvelope(msg.content, {
              publicKey: session.user.publicKey,
              secretKey: privateKey,
            });
            return { ...msg, content: decrypted };
          } catch (error) {
            return { ...msg, content: "[Unable to decrypt message]" };
          }
        })
      );

      data[0] = decryptedMessages;
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage[1].nextPage,
  });

  const keyExtractor = useCallback((item: Message) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      if (!session?.user) return null;
      return <MessageItem item={item} user={session.user} />;
    },
    [session]
  );

  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
    };
  }, []);

  const messages = useMemo(
    () => data?.pages.flatMap((page) => page[0] || []),
    [data]
  );

  const onEndReached = useCallback(() => {
    // Prevent requesting when already fetching or when no next page
    if (isFetching || !hasNextPage) return;
    fetchNextPage();
  }, [hasNextPage, fetchNextPage, isFetching]);

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["myRooms"],
    });
  }, [data]);

  return (
    <View className="flex-1 mt-1" style={{ paddingTop: headerHeight }}>
      <FlatList
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        inverted
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={15}
        onEndReached={onEndReached}
        keyboardShouldPersistTaps="handled"
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
      {!!session && !!privateKey && !!roomUsers && (
        <SendPrivateMessageInput
          roomId={room}
          roomUsers={roomUsers}
          privateKey={privateKey}
          user={session.user}
        />
      )}
      <Animated.View pointerEvents="none" style={fakeView} />
    </View>
  );
}
