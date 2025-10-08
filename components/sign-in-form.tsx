import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { AlertCircleIcon } from 'lucide-react-native';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, type TextInput, View } from 'react-native';
import z from 'zod';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export const formSchema = z.object({
  email: z.email(),
  password: z.string().min(1, {
    message: 'Password is required',
  }),
});

export function SignInForm() {
  const router = useRouter();
  const {
    control,
    formState: { errors },
    setError,
    handleSubmit,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const passwordInputRef = React.useRef<TextInput>(null);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await authClient.signIn.email(values, {
      onError: (error) => {
        setError('root', {
          message: error.error.message || 'Something went wrong',
        });
      },
    });
  };

  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Sign in to your app</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome back! Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-2">
              {errors.root && (
                <Alert variant="destructive" icon={AlertCircleIcon}>
                  <AlertTitle>Credentials</AlertTitle>
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}
              {errors.email && (
                <Alert variant="destructive" icon={AlertCircleIcon}>
                  <AlertTitle>Email</AlertTitle>
                  <AlertDescription>{errors.email.message}</AlertDescription>
                </Alert>
              )}
              {errors.password && (
                <Alert variant="destructive" icon={AlertCircleIcon}>
                  <AlertTitle>Password</AlertTitle>
                  <AlertDescription>{errors.password.message}</AlertDescription>
                </Alert>
              )}
            </View>
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
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
                    onSubmitEditing={onEmailSubmitEditing}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="ml-auto h-4 px-1 py-0 web:h-fit sm:h-4"
                  onPress={() => {
                    // TODO: Navigate to forgot password screen
                  }}>
                  <Text className="font-normal leading-4">Forgot your password?</Text>
                </Button>
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={passwordInputRef}
                    id="password"
                    secureTextEntry
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                  />
                )}
              />
            </View>
            <Button className="w-full" onPress={handleSubmit(onSubmit)}>
              <Text>Continue</Text>
            </Button>
          </View>
          <View className="flex-row justify-center gap-1">
            <Text className="text-center text-sm">Don&apos;t have an account?</Text>
            <Pressable
              onPress={() => {
                router.push('/sign-up');
              }}>
              <Text className="text-sm underline underline-offset-4">Sign up</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
