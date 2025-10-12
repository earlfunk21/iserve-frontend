import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useOnboardStore } from "@/hooks/use-on-boarding";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const steps = [
  {
    title: "Welcome to ChatApp",
    description: "Connect with friends and family in real-time",
  },
  {
    title: "Secure Messaging",
    description: "Your messages are encrypted and secure",
  },
  {
    title: "Get Started",
    description: "Sign in or create an account to begin",
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { onboard } = useOnboardStore();

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // use the new key "onboarded"
      await onboard();
      router.push("/sign-in");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleSkip = async () => {
    await onboard();
    router.push("/sign-in");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-between p-6">
        {/* Top bar */}
        <View className="flex-row items-center justify-end">
          <Pressable
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            className="px-3 py-2"
          >
            <Text className="font-medium text-primary">Skip</Text>
          </Pressable>
        </View>

        {/* Center card */}
        <View className="items-center">
          <View className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
            <Text className="text-center text-foreground" variant="h1">
              {steps[currentStep].title}
            </Text>
            <Text
              className="mt-2 text-center text-muted-foreground"
              variant="lead"
            >
              {steps[currentStep].description}
            </Text>

            {/* Actions */}
            <View className="mt-6">
              <Button
                onPress={handleNext}
                accessibilityLabel={
                  currentStep === steps.length - 1 ? "Get Started" : "Next"
                }
                className="w-full rounded-xl bg-primary"
              >
                <Text className="text-primary-foreground">
                  {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                </Text>
              </Button>

              {currentStep > 0 && (
                <Pressable
                  onPress={handleBack}
                  accessibilityRole="button"
                  accessibilityLabel="Go back to previous step"
                  className="mt-3 w-full items-center rounded-xl border border-primary py-3"
                >
                  <Text className="font-medium text-primary">Back</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Bottom progress */}
        <View className="mt-6">
          <View className="h-1.5 w-full max-w-sm self-center overflow-hidden rounded-full bg-muted">
            <View
              className="h-full bg-primary"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
