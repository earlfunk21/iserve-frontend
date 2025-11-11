import { useAppState } from "@/hooks/use-app-state";
import { useOnlineManager } from "@/hooks/use-online-manager";
import { NAV_THEME } from "@/lib/theme";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import * as React from "react";
import { AppStateStatus, Platform } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashScreenController } from "./splash";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: true,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      retry: 2,
      staleTime: 0,
    },
  },
});

type Props = {
  children: React.ReactNode;
};

export default function Providers({ children }: Props) {
  const { colorScheme } = useColorScheme();
  useOnlineManager();

  useAppState((status: AppStateStatus) => {
    if (Platform.OS !== "web") {
      const isActive = status === "active";
      focusManager.setFocused(isActive);
      if (isActive) {
        queryClient.invalidateQueries({ queryKey: ["myRooms"] });
      }
    }
  });

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <SplashScreenController />
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
      <PortalHost />
    </ThemeProvider>
  );
}
