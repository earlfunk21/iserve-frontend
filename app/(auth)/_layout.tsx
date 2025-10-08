import { authClient } from '@/lib/auth-client';
import { Redirect, Slot } from 'expo-router';

export default function AuthLayout() {
  const { data: session } = authClient.useSession();

  if (session) {
    return <Redirect href="/(main)" />;
  }

  return <Slot />;
}
