import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useOnboardStore } from '@/hooks/use-on-boarding';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

const steps = [
  {
    title: 'Welcome to ChatApp',
    description: 'Connect with friends and family in real-time',
  },
  {
    title: 'Secure Messaging',
    description: 'Your messages are encrypted and secure',
  },
  {
    title: 'Get Started',
    description: 'Sign in or create an account to begin',
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
      router.push('/sign-in');
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-4">
      <View className="w-full max-w-sm gap-4">
        <Text className="text-center" variant="h1">{steps[currentStep].title}</Text>
        <Text className="text-center" variant="lead">{steps[currentStep].description}</Text>
        <View className="flex-row justify-center gap-x-2">
          {steps.map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </View>
        <Button onPress={handleNext}>
          <Text>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</Text>
        </Button>
      </View>
    </View>
  );
}
