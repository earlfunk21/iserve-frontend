import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { usePrivateKeyStore } from "@/hooks/use-private-key";
import { authClient } from "@/lib/auth-client";
import { generateKeyPair } from "@/lib/crypto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  RefreshCwIcon,
} from "lucide-react-native";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  type TextStyle,
  View,
} from "react-native";
import Animated, {
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import z from "zod";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Icon } from "./ui/icon";

const RESEND_CODE_INTERVAL_SECONDS = 30;

const TABULAR_NUMBERS_STYLE: TextStyle = { fontVariant: ["tabular-nums"] };

export const formSchema = z.object({
  otp: z.string().min(1, { message: "OTP is required" }),
});

type Props = {
  handlePrevStep: () => void;
};

export default function EmailVerification({ handlePrevStep }: Props) {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const { countdown, restartCountdown } = useCountdown(
    RESEND_CODE_INTERVAL_SECONDS
  );
  const [sending, setSending] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const successShake = useSharedValue(0);
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onChange",
  });
  const { setPrivateKey } = usePrivateKeyStore();
  const otpValue = watch("otp");

  // Shake animation for success feedback
  const successAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: successShake.value }],
    };
  });

  const playSuccessAnimation = () => {
    successShake.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await authClient.signIn.emailOtp({
        email: email,
        otp: values.otp,
      });

      if (error) {
        setError("root", { message: error.message });
        return;
      }

      playSuccessAnimation();

      // Small delay for success animation to be visible
      setTimeout(async () => {
        const keyPair = generateKeyPair();

        await Promise.all([
          authClient.updateUser({
            publicKey: keyPair.publicKey,
          }),
          setPrivateKey(keyPair.secretKey),
        ]);

        router.replace("/");
      }, 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendVerificationOtp = async () => {
    setSending(true);
    await authClient.emailOtp.sendVerificationOtp(
      {
        email: email,
        type: "email-verification",
      },
      {
        onError: (error) => {
          setError("root", {
            message: error.error?.message || "Something went wrong",
          });
        },
      }
    );
    restartCountdown();
    setSending(false);
  };

  return (
    <Animated.View
      className="gap-6 w-full"
      entering={SlideInRight.duration(400)}
    >
      <Card className="rounded-3xl bg-card dark:bg-card border-border/0 sm:border-border pb-2 shadow-lg dark:shadow-primary/5">
        <CardHeader className="pb-2">
          <View className="flex-row items-center">
            <Pressable
              onPress={handlePrevStep}
              className="h-10 w-10 items-center justify-center rounded-full mb-2"
            >
              <Icon as={ArrowLeftIcon} size={20} className="text-muted-foreground" />
            </Pressable>
          </View>
          <CardTitle className="text-center text-xl text-foreground sm:text-left">
            Verify your email
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground sm:text-left">
            We've sent a verification code to{" "}
            <Text className="font-medium text-primary">{email}</Text>
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6 pt-4">
          <View className="gap-6">
            <View className="gap-2">
              {errors.root && (
                <Alert variant="destructive" icon={AlertCircleIcon}>
                  <AlertTitle>Verification Error</AlertTitle>
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}
            </View>
            <Animated.View className="gap-1.5" style={successAnimStyle}>
              <Label htmlFor="code" className="text-foreground font-medium">
                Verification code
              </Label>
              <Controller
                control={control}
                name="otp"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    id="code"
                    autoCapitalize="none"
                    returnKeyType="send"
                    keyboardType="numeric"
                    autoComplete="sms-otp"
                    textContentType="oneTimeCode"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoFocus
                    className="h-14 rounded-xl bg-muted/50 dark:bg-muted/30 text-center tracking-[12px] text-lg font-medium"
                    maxLength={6}
                  />
                )}
              />
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-xs text-muted-foreground">
                  Enter the 6-digit code
                </Text>
                <Pressable
                  disabled={countdown > 0 || sending}
                  onPress={async () => {
                    await handleSendVerificationOtp();
                    restartCountdown();
                  }}
                  className="flex-row items-center"
                >
                  {sending ? (
                    <ActivityIndicator size="small" className="mr-1" />
                  ) : countdown > 0 ? (
                    <ClockIcon
                      size={14}
                      className="text-muted-foreground mr-1"
                    />
                  ) : (
                    <Icon as={RefreshCwIcon} size={14} className="text-primary mr-1" />
                  )}
                  <Text
                    className={`text-xs ${countdown > 0 || sending ? "text-muted-foreground" : "text-primary font-medium"}`}
                  >
                    {countdown > 0
                      ? `Resend in ${countdown}s`
                      : sending
                        ? "Sending..."
                        : "Resend code"}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </CardContent>
        <CardFooter className="flex-col gap-3 pt-2">
          <Button
            className={`w-full rounded-full h-14 ${isValid ? "shadow-lg shadow-primary/20" : ""}`}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-base text-white">
                  Verify & Continue
                </Text>
                {otpValue?.length >= 5 && (
                  <Icon as={CheckCircle2Icon} size={18} className="text-white" />
                )}
              </View>
            )}
          </Button>
          <Button
            variant="ghost"
            className="mx-auto h-10"
            onPress={handlePrevStep}
            disabled={isSubmitting}
          >
            <Text className="text-muted-foreground">Cancel</Text>
          </Button>
        </CardFooter>
      </Card>
    </Animated.View>
  );
}

function useCountdown(seconds = 30) {
  const [countdown, setCountdown] = React.useState(seconds);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = React.useCallback(() => {
    setCountdown(seconds);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds]);

  React.useEffect(() => {
    startCountdown();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startCountdown]);

  return { countdown, restartCountdown: startCountdown };
}
