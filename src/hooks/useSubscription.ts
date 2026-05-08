import { useEffect } from "react";
import { CONFIG } from "../constants/config";
import { getSubscriptionStatus } from "../services/subscription";
import { useAppStore } from "../store";

export function useSubscription(userId?: string) {
  const setPremium = useAppStore((s) => s.setPremium);
  useEffect(() => {
    if (CONFIG.PREMIUM_ALL_FOR_DEV) {
      setPremium(true);
      return;
    }
    let mounted = true;
    getSubscriptionStatus(userId).then((isPremium) => {
      if (mounted) setPremium(isPremium);
    });
    return () => {
      mounted = false;
    };
  }, [setPremium, userId]);
}
