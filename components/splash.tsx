import { useOnboardStore } from "@/hooks/use-on-boarding";
import { authClient } from "@/lib/auth-client";
import { SplashScreen } from "expo-router";

export function SplashScreenController() {
  const { isPending } = authClient.useSession();
  const { loading } = useOnboardStore();

  if (!isPending && !loading) {
    SplashScreen.hideAsync();
  }

  return null;
}
