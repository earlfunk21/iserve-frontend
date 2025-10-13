import api from "@/lib/api";
import useSWRMutation from "swr/mutation";

export const useSendPrivateMessage = () => {
  return useSWRMutation(
    `/chat/send-private-message`,
    sendPrivateMessage,
    {
      throwOnError: false,
    }
  );
};

type SendPrivateMessageArg = {
  content: string;
  receiver: string;
};

async function sendPrivateMessage(
  url: string,
  { arg }: { arg: SendPrivateMessageArg }
) {
  return api.post(url, {
    content: arg.content,
    receiver: arg.receiver,
  });
}
