import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  HomeIcon,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";
// shadcn/ui components (aligned with sign-in-form.tsx usage)
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Link } from "expo-router";
import { Icon } from "./ui/icon";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type Values = z.infer<typeof formSchema>;

export function UpdateProfileForm() {
  const { data: session } = authClient.useSession();

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors, isSubmitSuccessful },
  } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(
      () => ({
        name: session?.user.name ?? "",
      }),
      [session]
    ),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await authClient.updateUser({ name: values.name });
    } catch (error: any) {
      setError("root", {
        message: error?.message ?? "Failed to update profile",
      });
    }
  };

  return (
    <Card className="rounded-3xl bg-card dark:bg-card border-border/0 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5">
      <CardHeader>
        <CardDescription>Manage your personal information</CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <View className="gap-2">
          <Label htmlFor="name">Full name</Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                id="name"
                placeholder="Enter your full name"
                className="h-12 rounded-xl bg-muted/50 dark:bg-muted/30"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />
          {errors.name?.message ? (
            <Text className="text-destructive text-xs mt-1">
              {errors.name.message}
            </Text>
          ) : null}
        </View>

        {errors.root?.message ? (
          <Alert variant="destructive" icon={AlertCircleIcon} className="mt-4">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="rounded-full w-full h-14 shadow-lg shadow-primary/20 mt-6"
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        >
          <Text className="text-primary-foreground">Save changes</Text>
        </Button>
      </CardContent>
      <CardFooter>
        {isSubmitSuccessful && (
          <Alert
            icon={CheckCircle2Icon}
            className="border-green-800 rounded-xl"
            iconClassName="text-green-500"
          >
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-800">
              Your profile has been updated successfully.
            </AlertDescription>
            <Link href={`/`} asChild>
              <Button variant="outline" className="rounded-full active:bg-primary/40">
                <Icon className="text-primary" as={HomeIcon} />
                <Text className="text-primary">Go to home</Text>
              </Button>
            </Link>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}

export default UpdateProfileForm;
