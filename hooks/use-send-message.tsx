import api from "@/lib/api";
import useSWRMutation from "swr/mutation";

export const useSendMessage = () => {
  return useSWRMutation("/chat/send-message", sendMessage, {
    throwOnError: false,
  });
};

type SendMessageArg = {
  content: string;
  roomId: string;
};

async function sendMessage(_: unknown, { arg }: { arg: SendMessageArg }) {
  return api.post("/chat/send-message", arg);
}
