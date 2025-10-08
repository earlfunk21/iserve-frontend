import { SplashScreenController } from "@/components/splash";
import "@/global.css";
import { useOnboardStore } from "@/hooks/use-on-boarding";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/theme";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SWRConfig } from "swr";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
      <SWRConfig>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <SplashScreenController />
        <SafeAreaProvider>
          <KeyboardProvider>
            <RootNavigator />
          </KeyboardProvider>
        </SafeAreaProvider>
        <PortalHost />
      </SWRConfig>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { onboarded, loading } = useOnboardStore();
  const { data: session, isPending } = authClient.useSession();

  if (loading || isPending) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Protected guard={onboarded}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(main)" />
        </Stack.Protected>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
