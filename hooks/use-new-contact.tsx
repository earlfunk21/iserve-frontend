import api from "@/lib/api";
import useSWRMutation from "swr/mutation";

export const useNewContact = () => {
  return useSWRMutation(`/user/add-contact`, sendPrivateMessage, {
    throwOnError: false,
  });
};

type NewContactArg = {
  contactId: string;
};

async function sendPrivateMessage(
  url: string,
  { arg }: { arg: NewContactArg }
) {
  return api.patch(url + `/${arg.contactId}`);
}
