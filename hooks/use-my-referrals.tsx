import api from "@/lib/api";
import useSWR from "swr";

type MyReferral = {
  id: string;
  name: string;
};

export const useMyReferrals = () => {
  return useSWR<MyReferral[]>(`/user/my-referrals`, (key: string) =>
    api.get(key).then((res) => res.data)
  );
};
