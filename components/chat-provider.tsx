// App.tsx (or root component)
import useNewMessage from "@/hooks/use-new-message";
import { useSocketStore } from "@/hooks/use-socket";
import { authClient } from "@/lib/auth-client";
import React, { ReactNode, useEffect } from "react";

type Props = {
  children: ReactNode | ReactNode[] | undefined;
};

const URL = `${process.env.EXPO_PUBLIC_WS_SERVER_URL}/chat`;

export default function ChatSocketProvider({ children }: Props) {
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session) {
      return;
    }
    connect(URL, {
      extraHeaders: {
        authorization: `${session.session.token}`,
      },
    });
    return () => {
      disconnect();
    };
  }, [session]);

  return (
    <>
      <NewMessageController />
      {children}
    </>
  );
}

function NewMessageController() {
  useNewMessage();

  return null;
}
