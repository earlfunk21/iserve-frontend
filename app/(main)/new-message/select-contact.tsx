import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { MyContact, useMyContacts } from "@/hooks/use-my-contacts";
import { MyReferral, useMyReferrals } from "@/hooks/use-my-referrals";
import { getInitials } from "@/lib/utils";
import { Asset, useAssets } from "expo-asset";
import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, View } from "react-native";

export default function NewMessage() {
  const { data: myReferrals } = useMyReferrals();
  const { data: myContacts } = useMyContacts();
  const router = useRouter();
  const [assets] = useAssets([
    require("@/assets/images/person-placeholder.png"),
  ]);

  const onPress = useCallback((id: string, name: string) => {
    router.replace(`/new-message?name=${name}&id=${id}`);
  }, []);

  return (
    <View className="flex-1 relative">
      <Stack.Screen
        options={{
          title: "Select Contact",
        }}
      />
      <View className="gap-4">
        <FlatList
          data={myReferrals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContactItem item={item} onPress={onPress} assets={assets} />
          )}
          ListHeaderComponent={() => (
            <Text variant="large" className="px-4 pt-2 pb-2">
              My Referrals
            </Text>
          )}
          ListEmptyComponent={
            <Text variant="muted" className="px-4 text-muted-foreground">
              No referrals yet
            </Text>
          }
        />
        <FlatList
          data={myContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContactItem item={item} onPress={onPress} assets={assets} />
          )}
          ListHeaderComponent={() => (
            <Text variant="large" className="px-4 pt-2 pb-2">
              My Contacts
            </Text>
          )}
          ListEmptyComponent={
            <Text variant="muted" className="px-4 text-muted-foreground">
              No contacts yet
            </Text>
          }
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add contact"
        onPress={() => router.push("/new-contact")}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full items-center justify-center bg-primary dark:bg-primary shadow-lg z-50 active:opacity-80"
      >
        <Text className="text-primary-foreground text-2xl leading-none">+</Text>
      </Pressable>
    </View>
  );
}

type Props = {
  item: MyContact | MyReferral;
  assets: Asset[] | undefined;
  onPress: (id: string, name: string) => void;
};

function ContactItem({ item, onPress, assets }: Props) {
  return (
    <Pressable
      onPress={() => {
        onPress(item.id, item.name);
      }}
      className="px-4 py-1 flex-row items-center gap-x-3 flex-1"
    >
      <Avatar alt={`${item.name}'s Avatar`} className="h-14 w-14">
        <AvatarImage source={assets ? { uri: assets[0]?.uri } : undefined} />
        <AvatarFallback>
          <Text>{getInitials(item.name)}</Text>
        </AvatarFallback>
      </Avatar>
      <Text>{item.name}</Text>
    </Pressable>
  );
}
