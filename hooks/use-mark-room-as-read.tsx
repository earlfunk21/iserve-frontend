import api from "@/lib/api";
import useSWRMutation from "swr/mutation";

export const useMarkRoomAsRead = (roomId: string) => {
  return useSWRMutation(`/chat/mark-as-read/${roomId}`, markRoomAsRead);
};

async function markRoomAsRead(url: string) {
  await api.patch(url);
}
