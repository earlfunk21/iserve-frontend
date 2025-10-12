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
import { useRouter } from "expo-router";
import { AlertCircleIcon } from "lucide-react-native";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { type TextInput, View } from "react-native";
import z from "zod";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export const formSchema = z.object({
  email: z.email(),
});

type Props = {
  handleNextStep: () => void;
};

export function SendVerificationEmail({ handleNextStep }: Props) {
  const router = useRouter();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    setError,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: values.email,
      type: "sign-in",
    });

    if (error) {
      setError("root", {
        message: error.message,
      });
    }
    router.setParams({ email: values.email });
    handleNextStep();
  };

  return (
    <View className="gap-6">
      <Card className="rounded-3xl bg-card dark:bg-card border-border/0 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl text-foreground sm:text-left">
            Sign in to your app
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground sm:text-left">
            Welcome back! Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-2">
              {errors.root && (
                <Alert variant="destructive" icon={AlertCircleIcon}>
                  <AlertTitle>Something went wrong</AlertTitle>
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}
            </View>
            <View className="gap-1.5">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    id="email"
                    placeholder="m@example.com"
                    keyboardType="email-address"
                    autoComplete="email"
                    autoCapitalize="none"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className="h-12 rounded-xl bg-muted/50 dark:bg-muted/30"
                  />
                )}
              />
            </View>
            <Button
              className="rounded-full w-full h-14 shadow-lg shadow-primary/20"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              <Text variant="large">Get Started</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
