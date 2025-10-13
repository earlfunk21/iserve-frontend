import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BarcodeScanningResult,
  CameraView,
  scanFromURLAsync,
  useCameraPermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

export default function QRScannerView({ onClose }: { onClose?: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const lastScanRef = useRef(0);
  const router = useRouter();
  const [scanning, setScanning] = useState(true);

  // Animated scan line
  const FRAME_SIZE = 260;

  const [mediaPermission, requestMediaPermission] =
    ImagePicker.useMediaLibraryPermissions();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <Text className="text-gray-700 dark:text-gray-200">
          Loading permissions...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white px-6 dark:bg-black">
        <Text className="text-center text-base text-gray-800 dark:text-gray-100">
          Camera access is required to scan QR codes.
        </Text>
        <Button onPress={requestPermission}>
          <Text>Grant Permission</Text>
        </Button>
      </View>
    );
  }

  const handleBarCodeScanned = (scanningResult: BarcodeScanningResult) => {
    const now = Date.now();
    // Debounce: only handle if not recently scanned
    if (scanned || now - lastScanRef.current < 2000) {
      return;
    }
    lastScanRef.current = now;

    setScanned(true);
    router.setParams({ referrerId: scanningResult.data });
  };

  // Select an image from the library and try to read a QR code from it
  const importFromGallery = async () => {
    // pause live scanning while importing
    setScanning(true);

    if (!mediaPermission?.granted) {
      const perm = await requestMediaPermission();
      if (!perm.granted) {
        // resume live scanning if permission denied
        setScanning(false);
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      setScanning(false);
      return;
    }

    const uri = result.assets[0].uri;

    const scanResult = await scanFromURLAsync(uri, ["qr"]);

    const referralId = scanResult[0].data;

    router.setParams({ referrerId: referralId });
    setScanned(true);
  };

  return (
    <View className="mt-safe relative flex-1 bg-white dark:bg-black">
      {scanning && (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          // Torch for better low-light scanning
          enableTorch={flashOn}
        />
      )}

      {/* Top bar */}
      <View className="pointer-events-auto absolute left-0 right-0 top-0 flex-row items-center justify-between px-5 pt-5">
        <Button onPress={() => (onClose ? onClose() : router.back())}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="chevron-back" size={18} />
            <Text>Back</Text>
          </View>
        </Button>
        <Button onPress={importFromGallery}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="qr-code-outline" size={18} />
            <Text>Import QR code</Text>
          </View>
        </Button>
      </View>

      {/* Center overlay: frame + instruction */}
      <View className="pointer-events-none absolute inset-0 items-center justify-center px-6">
        <Text className="mb-4 text-center text-base text-gray-100 dark:text-gray-100">
          Align the QR code within the frame
        </Text>

        {/* Scan frame */}
        <View
          style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
          className="relative"
        >
          {/* Corners */}
          <View className="absolute left-0 top-0 h-7 w-7 border-t-4 border-l-4 rounded" />
          <View className="absolute right-0 top-0 h-7 w-7 border-t-4 border-r-4 rounded" />
          <View className="absolute bottom-0 left-0 h-7 w-7 border-b-4 border-l-4 rounded" />
          <View className="absolute bottom-0 right-0 h-7 w-7 border-b-4 border-r-4 rounded" />
        </View>
      </View>

      {/* Bottom actions */}
      <View className="pointer-events-auto absolute bottom-8 left-5 right-5 flex-row items-center justify-between gap-3">
        <Button onPress={() => setFlashOn((v) => !v)}>
          <View className="flex-row items-center gap-2">
            <Ionicons name={flashOn ? "flash-off" : "flash"} size={18} />
            <Text>{flashOn ? "Turn Torch Off" : "Turn Torch On"}</Text>
          </View>
        </Button>
        {scanned && (
          <Button onPress={() => setScanned(false)}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="refresh" size={18} />
              <Text>Scan again</Text>
            </View>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
