import api from "@/lib/api";
import useSWR from "swr";

export type Message = {
  id: string;
  createdAt: Date;
  content: string;
  sender: {
    name: string;
    id: string;
    publicKey: string;
  };
};

export type MessagesResponse = Message[];

export const useMessages = (roomId: string) => {
  return useSWR<MessagesResponse>(
    `/chat/room/${roomId}/messages`,
    (key: string) => api.get(key).then((res) => res.data)
  );
};
