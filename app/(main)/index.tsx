import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { usePrivateKeyStore } from "@/hooks/use-private-key";
import api from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { decryptEnvelope } from "@/lib/crypto";
import { formatTime, getInitials } from "@/lib/utils";
import { MyRooms } from "@/types/core.types";
import { Paginate } from "@/types/paginate.type";
import { useHeaderHeight } from "@react-navigation/elements";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Asset, useAssets } from "expo-asset";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { memo, useCallback, useMemo } from "react";
import { FlatList, Pressable, View } from "react-native";

export default function HomeScreen() {
  const [assets] = useAssets([
    require("@/assets/images/person-placeholder.png"),
  ]);

  const { data: session } = authClient.useSession();
  const { privateKey } = usePrivateKeyStore();
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const headerHeight = useHeaderHeight();
  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["myRooms"],
    queryFn: async ({ pageParam }): Promise<Paginate<MyRooms>> => {
      const { data } = await api.get<Paginate<MyRooms>>(
        `/chat/my/rooms?page=${pageParam}${status ? "&status=" + status : ""}`
      );

      const myRooms = data[0];

      if (!session?.user || !privateKey) {
        throw Error("Not authenticated or no private key");
      }

      const decryptedMyRooms = await Promise.all(
        myRooms.map(async (myRoom) => {
          try {
            const decrypted = await decryptEnvelope(
              myRoom.room.messages[0].content,
              {
                publicKey: session.user.publicKey,
                secretKey: privateKey,
              }
            );
            return {
              ...myRoom,
              room: { ...myRoom.room, messages: [{ content: decrypted }] },
            };
          } catch (error) {
            return {
              ...myRoom,
              room: {
                ...myRoom.room,
                messages: [{ content: "[Unable to decrypt message]" }],
              },
            };
          }
        })
      );

      data[0] = decryptedMyRooms;

      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage[1].nextPage,
  });

  const gotoRoom = (roomId: string, name?: string) => {
    router.navigate(`/${roomId}?name=${name ?? "Unknown"}`);
  };

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, []);

  const rooms = useMemo(
    () => data?.pages.flatMap((page) => page[0] || []),
    [data]
  );

  return (
    <View
      className="flex-1 gap-y-2 sm:flex-1"
      style={{ paddingTop: headerHeight }}
    >
      <View className="px-4">
        <View className="mt-3 flex-row">
          <Pressable
            onPress={() => router.setParams({ status: undefined })}
            className={`mr-2 rounded-full px-3 py-1.5 border ${
              !status
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-muted/50 border-border text-muted-foreground dark:bg-muted/40"
            }`}
            android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
          >
            <Text
              className={
                !status ? "text-primary-foreground" : "text-muted-foreground"
              }
            >
              All
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.setParams({ status: "unread" })}
            className={`mr-2 rounded-full px-3 py-1.5 border ${
              status === "unread"
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-muted/50 border-border text-muted-foreground dark:bg-muted/40"
            }`}
            android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
          >
            <Text
              className={
                status === "unread"
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }
            >
              Unread
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.setParams({ status: "read" })}
            className={`mr-2 rounded-full px-3 py-1.5 border ${
              status === "read"
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-muted/50 border-border text-muted-foreground dark:bg-muted/40"
            }`}
            android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
          >
            <Text
              className={
                status === "read"
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }
            >
              Read
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.room.id}
        renderItem={({ item }) => (
          <RoomItem item={item} asset={assets?.[0]} gotoRoom={gotoRoom} />
        )}
        refreshing={false}
        onRefresh={refetch}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="items-center justify-center py-24 gap-y-3">
            <Icon as={SearchIcon} size={28} className="text-muted-foreground" />
            <Text className="text-muted-foreground">No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}

type RoomItemProps = {
  item: MyRooms;
  asset: Asset | undefined;
  gotoRoom: (roomId: string, name: string) => void;
};

const RoomItem = memo(({ item, asset, gotoRoom }: RoomItemProps) => {
  const name = item.room.participants?.[0]?.user.name ?? "Unknown";
  const source = asset ? { uri: asset?.uri } : undefined;

  return (
    <Pressable
      className="flex-row justify-between px-4 py-1"
      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
      onPress={() => {
        gotoRoom(item.room.id, name);
      }}
    >
      <View className="flex-row items-center gap-x-3 flex-1">
        <Avatar alt={`${name}'s Avatar`} className="h-14 w-14">
          <AvatarImage source={source} />
          <AvatarFallback>
            <Text>{getInitials(name)}</Text>
          </AvatarFallback>
        </Avatar>
        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="text-base font-semibold flex-1" numberOfLines={1}>
              {name}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            className="mt-0.5 text-sm text-muted-foreground"
          >
            {item.unread > 0
              ? "New Message"
              : (item.room.messages[0]?.content ?? "No messages yet")}
          </Text>
        </View>
      </View>

      <View className="justify-evenly">
        {item.unread > 0 && (
          <Badge
            className="ml-3 h-5 min-w-5 rounded-full px-1.5 self-end"
            variant="destructive"
          >
            <Text className="text-[10px]">{item.unread}</Text>
          </Badge>
        )}

        <Text className="ml-2 shrink-0 text-xs text-muted-foreground">
          {formatTime(item.room.updatedAt)}
        </Text>
      </View>
    </Pressable>
  );
});
