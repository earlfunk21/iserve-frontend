import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { User } from "@/lib/auth-client";
import { encryptForRecipients } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import { Message, RoomUser } from "@/types/core.types";
import { Paginate } from "@/types/paginate.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfiniteData, useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react-native";
import { memo, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { TouchableOpacity, View } from "react-native";
import z from "zod";

export const formSchema = z.object({
  content: z.string().trim().min(1, "Type a message"),
  roomId: z.string(),
});

type Props = {
  roomId: string;
  roomUsers: RoomUser[];
  privateKey: string;
  user: User;
};

export const SendPrivateMessageInput = memo(
  ({ roomId, roomUsers, privateKey, user }: Props) => {
    const { control, handleSubmit, reset, watch } = useForm<
      z.infer<typeof formSchema>
    >({
      resolver: zodResolver(formSchema),
      defaultValues: {
        content: "",
        roomId: roomId,
      },
    });
    const mutation = useMutation({
      mutationFn: async (values: { content: string; roomId: string }) => {
        const publicKeys = roomUsers.map(
          (p) => p.publicKey
        );
        const armoredContent = await encryptForRecipients(
          values.content,
          {
            publicKey: user.publicKey,
            secretKey: privateKey,
          },
          publicKeys
        );

        await api.post(`/chat/send-message`, {
          content: armoredContent,
          roomId: values.roomId,
        });
      },
      onMutate: async (data, context) => {
        await context.client.cancelQueries({ queryKey: ["room", roomId] });
        const previousData:
          | InfiniteData<Paginate<Message>, unknown>
          | undefined = context.client.getQueryData(["room", roomId]);

        const optimisticMessage: Message = {
          content: data.content,
          id: `optimistic-${Date.now()}`,
          sender: {
            id: user.id,
            name: user.name,
            publicKey: user.publicKey,
          },
          createdAt: new Date(),
        };

        if (previousData) {
          context.client.setQueryData(["room", roomId], {
            ...previousData,
            pages: [
              [
                [optimisticMessage, ...previousData.pages[0][0]],
                previousData.pages[0][1],
                previousData.pages[1],
              ],
            ],
          });
        }

        return {
          previousData,
        };
      },
      onError: (err, newData, onMutateResult, context) => {
        context.client.setQueryData(
          ["room", roomId],
          onMutateResult?.previousData
        );
      },
      onSettled: (data, error, variables, onMutateResult, context) => {
        context.client.invalidateQueries({ queryKey: ["myRooms"] });
        context.client.invalidateQueries({ queryKey: ["room", roomId] });
      },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
      const trimmed = values.content.trim();
      if (!trimmed) return;

      mutation.mutate({ content: trimmed, roomId: roomId });

      reset({ content: "", roomId });
    };

    const contentValue = watch("content");
    const canSend = useMemo(
      () => (contentValue?.trim().length ?? 0) > 0 && !!roomUsers,
      [contentValue, roomUsers]
    );

    return (
      <View className="px-3 pb-4 pt-2">
        <View className="flex-row items-end">
          <Controller
            control={control}
            name="content"
            render={({ field: { onChange, onBlur, value } }) => (
              <Textarea
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                className="flex-1 rounded-2xl px-4 bg-gray-100 dark:bg-gray-900 pt-2 placeholder:text-primary-foreground"
                placeholder="Type a message…"
              />
            )}
          />
          <TouchableOpacity
            className={cn(
              "ml-2 rounded-full p-3 shadow-sm",
              canSend ? "bg-blue-500 active:opacity-90" : "bg-blue-500/50"
            )}
            activeOpacity={0.8}
            onPress={handleSubmit(onSubmit)}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);
