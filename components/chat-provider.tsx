// App.tsx (or root component)
import { useSocketEvent, useSocketStore } from "@/hooks/use-socket";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";

type Props = {
  children: ReactNode | ReactNode[] | undefined;
};

const URL = `${process.env.EXPO_PUBLIC_WS_SERVER_URL}/chat`;

export default function ChatSocketProvider({ children }: Props) {
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);
  const connected = useSocketStore((s) => s.connected);
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

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

  useSocketEvent<{ roomId: string }>(
    "newMessage",
    ({ roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["myRooms"] });
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    },
    connected
  );

  if(!connected){
    return null;
  }

  return children
}
