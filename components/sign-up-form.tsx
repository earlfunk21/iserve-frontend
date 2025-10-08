import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { AlertCircleIcon } from 'lucide-react-native';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import z from 'zod';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { authClient } from '@/lib/auth-client';

export const formSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(1, {
        message: 'Password is required',
      })
      .transform((val) => val.trim()),
    confirmPassword: z
      .string()
      .min(1, { message: 'Confirm password is required' })
      .transform((val) => val.trim()),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['password'],
  });

type Props = {
  referrerId: string;
};

export function SignUpForm({ referrerId }: Props) {
  const router = useRouter();
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);
  const confirmPasswordInputRef = React.useRef<TextInput>(null);

  function onNameSubmitEditing() {
    emailInputRef.current?.focus();
  }

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  function onPasswordSubmitEditing() {
    confirmPasswordInputRef.current?.focus();
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // only send required fields (omit confirmPassword)
    const { name, email, password } = values;
    await authClient.signUp.email(
      {
        name,
        email,
        password,
        referrerId,
      },
      {
        onError: (error) => {
          setError('root', {
            message: error.error?.message || 'Something went wrong',
          });
        },
        onSuccess: () => {
          router.push(`/sign-up/success?email=${encodeURIComponent(email)}`);
        },
      }
    );
  };

  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Create your account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome! Please fill in the details to get started.
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
              <Label htmlFor="name">Name</Label>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Enter your name"
                    autoCapitalize="words"
                    onSubmitEditing={onNameSubmitEditing}
                    returnKeyType="next"
                    submitBehavior="submit"
                  />
                )}
              />
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
                    ref={emailInputRef}
                  />
                )}
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={passwordInputRef}
                    id="password"
                    secureTextEntry
                    returnKeyType="next"
                    onSubmitEditing={onPasswordSubmitEditing}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="password"
                    autoCapitalize="none"
                  />
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={confirmPasswordInputRef}
                    id="confirmPassword"
                    secureTextEntry
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="confirm password"
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
            <Text className="text-center text-sm">Already have an account? </Text>
            <Pressable
              onPress={() => {
                router.push('/sign-in');
              }}>
              <Text className="text-sm underline underline-offset-4">Sign in</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
