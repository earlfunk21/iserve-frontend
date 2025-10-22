import { Text } from "@/components/ui/text";
import { User } from "@/lib/auth-client";
import { cn, formatTime } from "@/lib/utils";
import { Message } from "@/types/core.types";
import { memo, useMemo } from "react";
import { View } from "react-native";

type Props = {
  item: Message;
  user: User;
};

export const MessageItem = memo(
  ({ item, user }: Props) => {
    const isMe = item.sender.id === user.id;
    const timeText = useMemo(
      () => formatTime(item.createdAt),
      [item.createdAt]
    );

    return (
      <View className={cn("mb-3 px-2", isMe ? "items-end" : "items-start")}>
        {!isMe && (
          <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2 mb-1">
            {item.sender.name}
          </Text>
        )}

        <View
          className={cn(
            "px-4 py-2 rounded-2xl max-w-[80%] shadow-sm",
            isMe
              ? "bg-blue-500 rounded-tr-none"
              : "bg-gray-100 rounded-tl-none dark:bg-gray-900",
          )}
        >
          <Text
            className={cn(
              isMe ? "text-white" : "text-gray-900 dark:text-gray-100"
            )}
          >
            {item.content}
          </Text>
        </View>

        <Text
          className={cn(
            "mt-1 text-[10px] text-gray-500 dark:text-gray-400",
            isMe ? "mr-3" : "ml-3"
          )}
        >
          {timeText}
        </Text>
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.user.id === next.user.id &&
      prev.item.id === next.item.id &&
      Number(new Date(prev.item.createdAt)) ===
        Number(new Date(next.item.createdAt)) &&
      prev.item.sender.id === next.item.sender.id &&
      prev.item.sender.name === next.item.sender.name
    );
  }
);
