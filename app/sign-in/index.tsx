import EmailVerification from "@/components/email-verification";
import { SendVerificationEmail } from "@/components/sign-in-form";
import { useGradualAnimation } from "@/hooks/use-gradual-animation";
import { useAssets } from "expo-asset";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, useAnimatedStyle } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const [assets] = useAssets([require("@/assets/images/icon.png")]);
  const [currentStep, setCurrentStep] = useState(0);
  const { height } = useGradualAnimation();
  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
    };
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center px-6 gap-6"
      >
        <Animated.View
          entering={FadeIn.duration(600)}
          className="h-52 w-52 rounded-3xl overflow-hidden ring-1 ring-primary/20 dark:ring-primary/30 shadow-lg"
        >
          <Image
            source={assets ? { uri: assets[0].uri } : undefined}
            contentFit="cover"
            transition={1000}
            style={styles.image}
          />
        </Animated.View>

        {currentStep === 0 && (
          <View className="w-full max-w-sm">
            <SendVerificationEmail handleNextStep={handleNextStep} />
          </View>
        )}
        {currentStep === 1 && (
          <EmailVerification handlePrevStep={handlePrevStep} />
        )}

        <Animated.View style={fakeView} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  image: {
    flex: 1,
    width: "100%",
  },
});
