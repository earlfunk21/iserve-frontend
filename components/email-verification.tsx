import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircleIcon } from "lucide-react-native";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { type TextStyle, View } from "react-native";
import z from "zod";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

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
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await authClient.signIn.emailOtp({
      email: email,
      otp: values.otp,
    });

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    router.push("/");
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
    <View className="gap-6">
      <Card className="rounded-3xl bg-card dark:bg-card border-border/0 sm:border-border pb-4 shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl text-foreground sm:text-left">
            Verify your email
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground sm:text-left">
            Enter the verification code sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-2">
              {errors.root && (
                <Alert variant="destructive" icon={AlertCircleIcon}>
                  <AlertTitle>OTP Error</AlertTitle>
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}
            </View>
            <View className="gap-1.5">
              <Label htmlFor="code" className="text-foreground">
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
                    className="h-12 rounded-xl bg-muted/50 dark:bg-muted/30 text-center tracking-[12px] font-medium"
                  />
                )}
              />
              <Button
                variant="link"
                size="sm"
                disabled={countdown > 0 || sending}
                onPress={async () => {
                  await handleSendVerificationOtp();
                  restartCountdown();
                }}
              >
                <Text className="text-center text-xs text-muted-foreground">
                  Didn&apos;t receive the code? Resend{" "}
                  {countdown > 0 ? (
                    <Text className="text-xs" style={TABULAR_NUMBERS_STYLE}>
                      ({countdown})
                    </Text>
                  ) : null}
                </Text>
              </Button>
            </View>
            <View className="gap-3">
              <Button
                className="w-full rounded-full h-14 shadow-lg shadow-primary/20"
                onPress={handleSubmit(onSubmit)}
              >
                <Text>Continue</Text>
              </Button>
              <Button
                variant="link"
                className="mx-auto"
                onPress={handlePrevStep}
              >
                <Text className="text-muted-foreground">Cancel</Text>
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
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
