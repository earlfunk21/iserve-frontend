import { authClient } from "@/lib/auth-client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import EventSource from "react-native-sse";

export default function SignUpSuccessScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [error, setError] = useState<string | null>(null);
  const { countdown, restartCountdown } = useCountdown(30);
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const onSubmit = async () => {
    await authClient.sendVerificationEmail(
      {
        email,
      },
      {
        onError: (error) => {
          setError(error.error?.message || "Something went wrong");
        },
      }
    );
    restartCountdown();
  };

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.EXPO_PUBLIC_SERVER_URL}/user/email-verified/${email}`
    );

    eventSource.addEventListener("message", (event) => {
      const data = JSON.parse(event.data!);
      if (data.verified) {
        setSuccess(true);
      }
    });

    return () => {
      eventSource.removeAllEventListeners();
      eventSource.close();
    };
  }, []);

  if (success) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-100 px-4">
        <View className="w-full max-w-[320px] items-center rounded-2xl bg-white p-6 shadow-md">
          <Text className="mb-2 text-5xl">✅</Text>
          <Text className="text-xl font-bold text-green-600">
            Verified Successfully!
          </Text>
          <Text className="mt-2 text-center text-base text-neutral-600">
            Your account has been verified. You may now login to continue.
          </Text>
          <Pressable
            onPress={() => router.push("/sign-in")}
            className="mt-6 w-full rounded-lg bg-green-500"
          >
            <Text className="p-3 text-center font-semibold text-white">
              Go to Login
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-neutral-100 px-4">
      <View className="w-full max-w-[320px] gap-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <Text className="text-lg font-semibold text-neutral-800">
          Hello, {email}!
        </Text>
        <Text className="text-base text-neutral-600">
          Congratulations! You have successfully registered. Please check your
          email for the verification link.
        </Text>

        {error && (
          <Text className="text-sm font-medium text-red-500">{error}</Text>
        )}

        <Pressable
          onPress={onSubmit}
          disabled={countdown > 0}
          className={`${
            countdown > 0 ? "bg-blue-300" : "bg-blue-500"
          } rounded-lg font-semibold text-white`}
        >
          <Text className="p-3 text-center font-semibold text-white">
            {countdown > 0
              ? `Resend in ${countdown}s`
              : "Resend Verification Email"}
          </Text>
        </Pressable>
      </View>
      <View className="mt-4 w-full max-w-[320px] flex-row justify-between">
        <Pressable
          onPress={() => router.push("/sign-in")}
          className="mr-2 flex-1 rounded-lg bg-neutral-200"
        >
          <Text className="p-3 text-center font-semibold text-neutral-700">
            Go to Login
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/sign-up")}
          className="ml-2 flex-1 rounded-lg bg-neutral-200"
        >
          <Text className="p-3 text-center font-semibold text-neutral-700">
            Sign Up Again
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function useCountdown(seconds = 30) {
  const [countdown, setCountdown] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
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

  useEffect(() => {
    startCountdown();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startCountdown]);

  return { countdown, restartCountdown: startCountdown };
}
