import { Text } from "@/components/ui/text";
import { useMyReferrals } from "@/hooks/use-my-referrals";
import { useSelectContact } from "@/hooks/use-select-contact";
import { Stack, useRouter } from "expo-router";
import { FlatList, Pressable, View } from "react-native";

export default function NewMessage() {
  const { data } = useMyReferrals();
  const { select } = useSelectContact();
  const router = useRouter();

  return (
    <View>
      <Stack.Screen
        options={{
          title: "Select Contact",
        }}
      />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              select(item.id);
              router.replace(`/new-message?name=${item.name}`);
            }}
            style={{ padding: 16 }}
          >
            <Text>{item.name}</Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: "#eee" }} />
        )}
        ListHeaderComponent={() => (
          <Text className="px-4 pt-2 pb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            My Referrals
          </Text>
        )}
        ListEmptyComponent={
          <Text className="px-4 text-muted-foreground">No referrals yet</Text>
        }
      />
    </View>
  );
}
