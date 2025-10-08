import { Session } from "@/lib/auth-client";
import io, { Socket } from "socket.io-client";
import { create } from "zustand";

type ChatSocket = {
  socket: Socket | null;
  connect: (session: Session) => void;
  disconnect: () => void;
};

const useChatSocket = create<ChatSocket>((set, get) => ({
  socket: null,
  connect: (session: Session) => {
    const socket = io(`${process.env.EXPO_PUBLIC_WS_SERVER_URL}/chat`, {
      extraHeaders: {
        authorization: `${session.token}`,
      },
    });
    
    socket.on("connect_error", () => {
      setTimeout(() => {
        socket.connect();
      }, 1000);
    });

    set({ socket });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));

export default useChatSocket;
