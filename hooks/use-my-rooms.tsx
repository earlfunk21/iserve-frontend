import api from "@/lib/api";
import useSWR from "swr";

export const MyRoomsKeys = "/chat/my/rooms";


export type MyRooms = {
  id: string;
  participants: {
    name: string;
  }[];
  _count: {
    messages: number;
  };
  messages: {
    createdAt: Date;
    content: string;
    senderId: string;
  }[];
}

export type MyRoomsResponse = MyRooms[];

export const useMyRooms = () => {
  return useSWR<MyRoomsResponse>(MyRoomsKeys, (key: string) =>
    api.get(key).then((res) => res.data)
  );
};
