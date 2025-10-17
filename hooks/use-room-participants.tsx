import api from "@/lib/api";
import useSWR from "swr";

export type RoomParticipants = {
  participants: {
    id: string;
    name: string;
    publicKey: string;
  }[];
};

export const useRoomParticipants = (roomId: string) => {
  return useSWR<RoomParticipants>(
    `/chat/room/${roomId}/participants`,
    (key: string) => api.get(key).then((res) => res.data)
  );
};
