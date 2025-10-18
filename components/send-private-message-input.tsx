import { Textarea } from "@/components/ui/textarea";
import { Message, useMessages } from "@/hooks/use-messages";
import { RoomParticipants } from "@/hooks/use-room-participants";
import { useSendMessage } from "@/hooks/use-send-message";
import { User } from "@/lib/auth-client";
import { encryptForRecipients } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
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
  roomParticipants: RoomParticipants;
  privateKey: string;
  user: User;
  onOptimisticMessage: (id: string, content: string) => void;
};

export const SendPrivateMessageInput = memo(
  ({
    roomId,
    roomParticipants,
    privateKey,
    user,
    onOptimisticMessage,
  }: Props) => {
    const { control, handleSubmit, reset, watch } = useForm<
      z.infer<typeof formSchema>
    >({
      resolver: zodResolver(formSchema),
      defaultValues: {
        content: "",
        roomId: roomId,
      },
    });
    const { trigger } = useSendMessage();
    const { mutate: mutateMessages } = useMessages(roomId);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
      const trimmed = values.content.trim();
      if (!trimmed) return;

      const publicKeys = roomParticipants.participants.map((p) => p.publicKey);

      const armoredContent = await encryptForRecipients(
        trimmed,
        {
          publicKey: user.publicKey,
          secretKey: privateKey,
        },
        publicKeys
      );

      const optimisticMessage: Message = {
        content: JSON.stringify(armoredContent),
        id: `optimistic-${Date.now()}`,
        sender: {
          id: user.id,
          name: user.name,
          publicKey: user.publicKey,
        },
        createdAt: new Date(),
      };

      mutateMessages(
        (current: Message[] = []) => [optimisticMessage, ...current],
        false
      );

      onOptimisticMessage(optimisticMessage.id, trimmed);

      trigger(
        { content: JSON.stringify(armoredContent), roomId },
        {
          onError: () => {
            mutateMessages(
              (current = []) =>
                current.filter((m) => m.id !== optimisticMessage.id),
              false
            );
          },
          onSuccess: () => {
            mutateMessages();
          },
        }
      );

      reset({ content: "", roomId });
    };

    const contentValue = watch("content");
    const canSend = useMemo(
      () => (contentValue?.trim().length ?? 0) > 0 && !!roomParticipants,
      [contentValue, roomParticipants]
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
