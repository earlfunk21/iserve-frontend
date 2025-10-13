import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { MyRooms, useMyRooms } from "@/hooks/use-my-rooms";
import { authClient, User } from "@/lib/auth-client";
import { useHeaderHeight } from "@react-navigation/elements";
import { Asset, useAssets } from "expo-asset";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { memo } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";

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
function getInitials(name?: string) {
  if (!name) return "";
  const [a = "", b = ""] = name.trim().split(" ");
  return (a[0] || "").concat(b[0] || "").toUpperCase();
}

export default function HomeScreen() {
  const [assets] = useAssets([
    require("@/assets/images/person-placeholder.png"),
  ]);
  const { data, isLoading, mutate } = useMyRooms();
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const headerHeight = useHeaderHeight();

  const gotoRoom = (roomId: string, name?: string) => {
    router.navigate(`/${roomId}?name=${name ?? "Unknown"}`);
  };

  if (isLoading || isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View
      className="flex-1 gap-y-2 sm:flex-1"
      style={{ paddingTop: headerHeight }}
    >
      <View className="px-4">
        {/* Add: chip to filter rooms with messages */}
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
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoomItem
            item={item}
            asset={assets?.[0]}
            user={session?.user ?? null}
            gotoRoom={gotoRoom}
          />
        )}
        refreshing={!!isLoading}
        onRefresh={() => mutate()}
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
  user: User | null;
  gotoRoom: (roomId: string, name: string) => void;
};

const RoomItem = memo(({ item, asset, user, gotoRoom }: RoomItemProps) => {
  const lastMessage = item.messages?.[0];
  const name = item.participants?.[0]?.name ?? "Unknown";
  const source = asset ? { uri: asset?.uri } : undefined;

  return (
    <Pressable
      className="flex-row justify-between px-4 py-1"
      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
      onPress={() => {
        gotoRoom(item.id, name);
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
            {lastMessage.senderId === user?.id ? "You: " : ""}
            {lastMessage.content ?? "No messages yet"}
          </Text>
        </View>
      </View>

      <View className="justify-evenly">
        {item._count.messages > 0 && (
          <Badge
            className="ml-3 h-5 min-w-5 rounded-full px-1.5 self-end"
            variant="destructive"
          >
            <Text className="text-[10px]">{item._count.messages}</Text>
          </Badge>
        )}

        <Text className="ml-2 shrink-0 text-xs text-muted-foreground">
          {formatTime(lastMessage.createdAt as any)}
        </Text>
      </View>
    </Pressable>
  );
});
