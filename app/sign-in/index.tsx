import EmailVerification from "@/components/email-verification";
import { SendVerificationEmail } from "@/components/sign-in-form";
import { useGradualAnimation } from "@/hooks/use-gradual-animation";
import { useAssets } from "expo-asset";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
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
      <StatusBar style="auto" />
      <LinearGradient
        colors={["#72E3AD", "#121212"]}
        className="absolute inset-0"
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center px-6 gap-8"
      >
        <View className="h-52 w-52 rounded-3xl overflow-hidden ring-1 ring-primary/20 dark:ring-primary/30 shadow-xl">
          {assets && (
            <Image
              source={{ uri: assets[0].uri }}
              contentFit="cover"
              transition={1200}
              style={styles.image}
              className="bg-card"
            />
          )}
          <LinearGradient
            colors={["transparent", "#72E3AD"]}
            className="absolute inset-0"
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 1.8 }}
          />
        </View>

        <Animated.View
          className="w-full max-w-sm"
          entering={FadeIn.duration(700).delay(400)}
        >
          {currentStep === 0 && (
            <SendVerificationEmail handleNextStep={handleNextStep} />
          )}
          {currentStep === 1 && (
            <EmailVerification handlePrevStep={handlePrevStep} />
          )}
        </Animated.View>

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
