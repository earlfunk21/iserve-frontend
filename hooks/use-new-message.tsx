import { useSocketEvent, useSocketStore } from "@/hooks/use-socket";
import { useQueryClient } from "@tanstack/react-query";

export default function useNewMessage() {
  const connected = useSocketStore((s) => s.connected);
  const queryClient = useQueryClient();

  useSocketEvent<{ roomId: string }>(
    "newMessage",
    ({ roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["myRooms"] });
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    },
    connected
  );

  return null;
}
