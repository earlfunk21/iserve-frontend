import { SignInForm } from "@/components/sign-in-form";
import { useAssets } from "expo-asset";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";

export default function SignInScreen() {
  const [assets] = useAssets([require("@/assets/images/icon.png")]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="sm:flex-1 items-center justify-center p-4 py-8 sm:py-4 sm:p-6 mt-safe bg-black"
      keyboardDismissMode="interactive"
    >
      <View className="h-52 w-52">
        <Image
          source={assets ? { uri: assets[0].uri } : undefined}
          contentFit="cover"
          transition={1000}
          style={styles.image}
        />
      </View>
      <View className="w-full max-w-sm">
        <SignInForm />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  image: {
    flex: 1,
    width: "100%",
  },
});
