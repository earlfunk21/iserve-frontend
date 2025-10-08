import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from './ui/button';
import { Text } from './ui/text';

export default function QRScannerView() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lastScanRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View>
        <Text>Loading permissions...</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Camera access is required to scan QR codes.</Text>
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

  return (
    <View className="mt-safe relative flex-1">
      <View className="absolute bottom-[40] left-[20] right-[20] h-40 w-40  z-50" />
      <CameraView
        style={styles.camera}
        facing="back"
        // Possibly required in some versions to enable scanning
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {scanned && (
        <View className="absolute bottom-[40] left-[20] right-[20] flex-1">
          <Button onPress={() => setScanned(false)}>
            <Text>Scan again</Text>
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
