import Providers from "@/components/providers";
import UpdateBanner from "@/components/update-banner";
import "@/global.css";
import { SplashScreen, Stack } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <>
      <UpdateBanner />
      <Providers>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </Providers>
    </>
  );
}
