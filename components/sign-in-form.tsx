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
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LockIcon,
  MailIcon,
} from "lucide-react-native";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, View } from "react-native";
import z from "zod";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Icon } from "./ui/icon";

export const formSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
});

type Props = {
  handleNextStep: () => void;
};

export function SendVerificationEmail({ handleNextStep }: Props) {
  const router = useRouter();
  const [isValidating, setIsValidating] = React.useState(false);

  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    setError,
    watch,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const emailValue = watch("email");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: values.email,
      type: "sign-in",
    });

    if (error) {
      setError("root", {
        message: error.message,
      });
      return;
    }
    router.setParams({ email: values.email });
    handleNextStep();
  };

  return (
    <View className="gap-6 w-full">
      <Card className="rounded-3xl bg-card dark:bg-card border-border/0 shadow-lg dark:shadow-primary/5">
        <CardHeader>
          <View>
            <CardTitle className="text-center text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your email to sign in or create an account
            </CardDescription>
          </View>
        </CardHeader>
        <CardContent className="gap-6 pt-4">
          <View className="gap-6">
            <View>
              {errors.root && (
                <Alert variant="destructive" icon={AlertCircleIcon}>
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}
            </View>

            <View className="gap-2">
              <Label
                htmlFor="email"
                className="text-foreground font-medium ml-1"
              >
                Email Address
              </Label>
              <View className="flex-row items-center rounded-xl border-2 border-border/60 dark:border-border/40 overflow-hidden bg-muted/50 dark:bg-muted/30 pl-2">
                <View className="items-center justify-center p-3">
                  <Icon
                    as={MailIcon}
                    size={20}
                    className="text-muted-foreground"
                  />
                </View>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      id="email"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoComplete="email"
                      autoCapitalize="none"
                      onSubmitEditing={
                        isValid ? handleSubmit(onSubmit) : undefined
                      }
                      returnKeyType="go"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      className="flex-1 h-12 border-0 text-base"
                    />
                  )}
                />
                {emailValue && emailValue.includes("@") && (
                  <View className="h-7 w-7 items-center justify-center rounded-full mx-2">
                    <Icon
                      as={CheckCircleIcon}
                      size={20}
                      className="text-primary"
                    />
                  </View>
                )}
              </View>

              {errors.email && (
                <Text className="text-destructive text-xs pl-1">
                  {errors.email.message}
                </Text>
              )}
            </View>
          </View>
        </CardContent>
        <CardFooter className="flex-col gap-3 pt-2">
          <View className="w-full">
            <Button
              className={`rounded-full w-full h-14 ${isValid ? "shadow-lg shadow-primary/20" : ""}`}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting || isValidating}
            >
              {isSubmitting || isValidating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View className="flex-row items-center justify-center gap-2">
                  <Text className="font-semibold text-base text-white">
                    Continue
                  </Text>
                  <Icon as={ArrowRightIcon} size={18} className="text-white" />
                </View>
              )}
            </Button>
            <Pressable className="mx-auto mt-4 py-3">
              <View className="flex-row items-center gap-1">
                <Icon
                  as={LockIcon}
                  size={14}
                  className="text-muted-foreground"
                />
                <Text className="text-xs text-muted-foreground">
                  Secure sign-in powered by E2E encryption
                </Text>
              </View>
            </Pressable>
          </View>
        </CardFooter>
      </Card>
    </View>
  );
}
