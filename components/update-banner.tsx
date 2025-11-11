import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useAutoUpdates } from "../hooks/use-auto-updates";

export const UpdateBanner: React.FC = () => {
  const {
    isChecking,
    isDownloading,
    isUpdateReady,
    checkNow,
    reloadNow,
    dismiss,
    error,
  } = useAutoUpdates({
    checkOnAppStart: true,
    checkOnForeground: true,
    checkIntervalMs: 6 * 60 * 60 * 1000,
    autoReload: false,
    allowCheckInDev: false,
  });

  if (!isChecking && !isDownloading && !isUpdateReady && !error) return null;

  return (
    <View className="absolute bottom-0 left-0 right-0 p-3 z-50">
      <View className="bg-card rounded-xl px-4 py-3 shadow-lg border border-gray-700 dark:border-gray-600">
        {isChecking && (
          <View className="flex-row items-center gap-3">
            <ActivityIndicator
              size="small"
              className="text-white dark:text-gray-200"
            />
            <Text className="text-white dark:text-gray-100 flex-1">
              Checking for updates…
            </Text>
          </View>
        )}
        {isDownloading && (
          <View className="flex-row items-center gap-3">
            <ActivityIndicator
              size="small"
              className="text-white dark:text-gray-200"
            />
            <Text className="text-white dark:text-gray-100 flex-1">
              Downloading update…
            </Text>
          </View>
        )}
        {isUpdateReady && (
          <View className="flex-row items-center flex-wrap gap-3">
            <Text className="text-white dark:text-gray-100 flex-1">
              Update ready
            </Text>
            <TouchableOpacity
              onPress={reloadNow}
              className="bg-primary px-4 py-2 rounded-lg active:opacity-80"
            >
              <Text className="text-white dark:text-gray-100 font-semibold">
                Restart
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={dismiss}
              className="bg-gray-700 dark:bg-gray-600 px-4 py-2 rounded-lg active:opacity-80"
            >
              <Text className="text-white dark:text-gray-100 font-semibold">
                Later
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {error && (
          <View className="flex-row items-center flex-wrap gap-3">
            <Text className="text-white dark:text-gray-100 flex-1">
              Update error: {String(error.message || error)}
            </Text>
            <TouchableOpacity
              onPress={checkNow}
              className="bg-primary px-4 py-2 rounded-lg active:opacity-80"
            >
              <Text className="text-white dark:text-gray-100 font-semibold">
                Retry
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={dismiss}
              className="bg-gray-700 dark:bg-gray-600 px-4 py-2 rounded-lg active:opacity-80"
            >
              <Text className="text-white dark:text-gray-100 font-semibold">
                Hide
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default UpdateBanner;
