import api from '@/lib/api';
import useSWR from 'swr';

type PrivateChatRoomResponse = {
  id: string;
};

export const usePrivateChatRoom = (userId?: string) => {
  return useSWR<PrivateChatRoomResponse>(
    !!userId ? `/chat/private-chat-room/${userId}` : undefined,
    (key: string) => api.get(key).then((res) => res.data)
  );
};
