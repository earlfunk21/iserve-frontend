import { SplashScreenController } from "@/components/splash";
import "@/global.css";
import { NAV_THEME } from "@/lib/theme";
import NetInfo from "@react-native-community/netinfo";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SWRConfig } from "swr";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const onlineRef = useRef(true);
  const isVisibleRef = useRef(AppState.currentState === "active");

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
      <SWRConfig
        value={{
          provider: () => new Map(),
          isVisible: () => {
            return isVisibleRef.current;
          },
          isOnline() {
            return onlineRef.current;
          },
          initReconnect(callback) {
            NetInfo.fetch().then((state) => {
              onlineRef.current = Boolean(state.isConnected);
            });
            const unsubscribe = NetInfo.addEventListener((state) => {
              const wasOnline = onlineRef.current;
              const nextOnline = Boolean(state.isConnected);
              onlineRef.current = nextOnline;
              if (!wasOnline && nextOnline) {
                callback();
              }
            });
            return () => unsubscribe();
          },
          initFocus(callback) {
            isVisibleRef.current = AppState.currentState === "active";
            let appState = AppState.currentState;

            const onAppStateChange = (nextAppState: AppStateStatus) => {
              isVisibleRef.current = nextAppState === "active";
              if (
                appState.match(/inactive|background/) &&
                nextAppState === "active"
              ) {
                callback();
              }
              appState = nextAppState;
            };

            const subscription = AppState.addEventListener(
              "change",
              onAppStateChange
            );

            return () => {
              subscription.remove();
            };
          },
        }}
      >
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <SplashScreenController />
        <SafeAreaProvider>
          <KeyboardProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </KeyboardProvider>
        </SafeAreaProvider>
        <PortalHost />
      </SWRConfig>
    </ThemeProvider>
  );
}
