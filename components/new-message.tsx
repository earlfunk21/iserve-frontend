import { MyRoomsKeys } from "@/hooks/use-my-rooms";
import useNewMessageSocket from "@/hooks/use-new-message";
import { Session } from "@/lib/auth-client";
import { useEffect } from "react";
import { useSWRConfig } from "swr";

type Props = {
  session: Session;
};

export default function NewMessage({ session }: Props) {
  const { mutate } = useSWRConfig();
  const { socket, connect, disconnect } = useNewMessageSocket();

  useEffect(() => {
    if (!session) return;

    connect(session);

    return () => {
      disconnect();
    };
  }, [session]);

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", ({ roomId }) => {
      mutate(MyRoomsKeys);
      mutate(`/chat/room/${roomId}/messages`);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [socket]);

  return null;
}
