import api from "@/lib/api";
import useSWR from "swr";

export type MyContact = {
  id: string;
  name: string;
  image: string;
  publicKey: string;
};

export const useMyContacts = () => {
  return useSWR<MyContact[]>(`/user/my-contacts`, (key: string) =>
    api.get(key).then((res) => res.data)
  );
};
