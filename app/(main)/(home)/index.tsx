import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { MyRooms, useMyRooms } from "@/hooks/use-my-rooms";
import { authClient } from "@/lib/auth-client";
import { useAssets } from "expo-asset";
import { useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { useCallback } from "react";
import { FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [assets] = useAssets([
    require("@/assets/images/person-placeholder.png"),
  ]);
  const { data, isLoading } = useMyRooms();
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const RoomItem = useCallback(
    ({ item }: { item: MyRooms }) => (
      <Pressable
        className="flex-row justify-between px-2"
        android_ripple={{
          color: "gray",
        }}
        onPress={() => {
          router.push(`/${item.id}?name=${item.participants[0].name}`);
        }}
      >
        <Avatar alt="Zach Nugent's Avatar" className="h-16 w-16">
          <AvatarImage source={assets ? { uri: assets[0].uri } : undefined} />
          <AvatarFallback>
            <Text>HW</Text>
          </AvatarFallback>
        </Avatar>
        <View className="ml-4 flex-1 pt-1">
          <Text className="text-lg font-medium">
            {item.participants[0].name}
          </Text>
          <Text numberOfLines={1} className="text-sm text-muted-foreground">
            {item.messages[0].senderId === session?.user.id && "You: "}
            {item.messages[0].content}
          </Text>
        </View>
        {item._count.messages > 0 && (
          <Badge
            className="h-6 w-6 self-center rounded-full px-1"
            variant="destructive"
          >
            <Text>{item._count.messages}</Text>
          </Badge>
        )}
      </Pressable>
    ),
    [assets]
  );

  if (isLoading || isPending) {
    return null;
  }

  return (
    <View className="gap-y-8 py-8 sm:flex-1">
      <SafeAreaView className="mt-safe-offset-2 gap-y-4">
        <View className="px-4">
          <View className="flex-row items-center rounded-full bg-secondary px-2">
            <Icon as={SearchIcon} size={22} />
            <Input
              placeholder="Search"
              className="border-0 bg-transparent dark:bg-transparent"
            />
          </View>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={RoomItem}
        />
      </SafeAreaView>
    </View>
  );
}
