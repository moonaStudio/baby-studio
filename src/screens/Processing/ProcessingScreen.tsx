import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useImageProcessor } from "../../hooks/useImageProcessor";
import { PROCESSING_OVERLAY_MAX_STEP, ProcessingOverlay } from "../../components/ProcessingOverlay";
import { isAuthGateSatisfied } from "../../constants/config";
import { useAppStore } from "../../store";

export function ProcessingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const { run, error, reset } = useImageProcessor();
  const userId = useAppStore((s) => s.userId);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthGateSatisfied(userId)) {
        navigation.navigate("Login");
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStarted(false);
      setStep(0);
      reset();

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setStarted(false);
        setStep(0);
        reset();
      };
    }, [navigation, userId, reset])
  );

  const start = async () => {
    if (started) return;
    if (!isAuthGateSatisfied(userId)) {
      navigation.navigate("Login");
      return;
    }
    setStarted(true);
    setStep(0);
    intervalRef.current = setInterval(
      () => setStep((s) => Math.min(s + 1, PROCESSING_OVERLAY_MAX_STEP)),
      1600
    );
    const result = await run();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (result) navigation.navigate("Result");
    else setStarted(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16, padding: 20 }}>
      {!started ? (
        <>
          <Text variant="titleMedium" style={{ textAlign: "center" }}>
            이미지 생성
          </Text>
          <Button mode="contained" onPress={start}>
            생성하기
          </Button>
        </>
      ) : (
        <ProcessingOverlay step={step} />
      )}
      {error && <Text style={{ color: "#B00020" }}>{error}</Text>}
    </View>
  );
}
