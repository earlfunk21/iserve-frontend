import EmailVerification from "@/components/email-verification";
import { SendVerificationEmail } from "@/components/sign-in-form";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAssets } from "expo-asset";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function SignInScreen() {
  const [assets] = useAssets([require("@/assets/images/icon.png")]);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="h-52 w-52">
        <Image
          source={assets ? { uri: assets[0].uri } : undefined}
          contentFit="cover"
          transition={1000}
          style={styles.image}
        />
      </View>
      {currentStep === 0 && (
        <>
          {/* Welcome text */}
          <View className="items-center mt-8">
            <Text variant="h1" className="text-primary">
              Welcome to iServe
            </Text>
            <Text
              variant="p"
              className="text-center mt-3 px-4 text-muted-foreground"
            >
              The best messenger and chat app of the century to make your day
              great!
            </Text>
          </View>

          <Button
            className="rounded-full w-full h-14"
            onPress={() => setCurrentStep(1)}
          >
            <Text variant="large">Get Started</Text>
          </Button>
        </>
      )}
      {currentStep === 1 && (
        <View className="w-full max-w-sm">
          <SendVerificationEmail handleNextStep={handleNextStep} />
        </View>
      )}
      {currentStep === 2 && (
        <EmailVerification handlePrevStep={handlePrevStep} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    flex: 1,
    width: "100%",
  },
});
