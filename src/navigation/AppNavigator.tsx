import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/Home/HomeScreen";
import { CameraScreen } from "../screens/Camera/CameraScreen";
import { GalleryScreen } from "../screens/Gallery/GalleryScreen";
import { SettingsScreen } from "../screens/Settings/SettingsScreen";
import { LoginScreen } from "../screens/Auth/LoginScreen";
import { SignupScreen } from "../screens/Auth/SignupScreen";
import { ProcessingScreen } from "../screens/Processing/ProcessingScreen";
import { ResultScreen } from "../screens/Result/ResultScreen";
import { SubscriptionScreen } from "../screens/Subscription/SubscriptionScreen";
import { CreateSourceScreen } from "../screens/Create/CreateSourceScreen";
import { ModeSelectScreen } from "../screens/Create/ModeSelectScreen";
import { ThemeSelectScreen } from "../screens/Create/ThemeSelectScreen";
import { UploadScreen } from "../screens/Upload/UploadScreen";
import { ThemesScreen } from "../screens/Themes/ThemesScreen";
import { GenderSelectScreen } from "../screens/Create/GenderSelectScreen";
import * as Linking from "expo-linking";
import { refreshPhotoCreditsForSession } from "../services/billing";
import { CONFIG } from "../constants/config";
import { getCurrentUserId, supabase } from "../services/supabase";
import { useAppStore } from "../store";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarAllowFontScaling: false }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "홈",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateSourceScreen}
        options={{
          tabBarButton: () => null
        }}
      />
      <Tab.Screen
        name="Theme"
        component={ThemesScreen}
        options={{
          tabBarLabel: "테마",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="palette-outline" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          tabBarLabel: "갤러리",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="image-multiple-outline" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="You"
        component={SettingsScreen}
        options={{
          tabBarLabel: "내 정보",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="CameraCapture"
        component={CameraScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="UploadPick"
        component={UploadScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="ModeSelect"
        component={ModeSelectScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="ThemeSelect"
        component={ThemeSelectScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="GenderSelect"
        component={GenderSelectScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen name="Result" component={ResultScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const setUserId = useAppStore((s) => s.setUserId);
  const setPhotoCredits = useAppStore((s) => s.setPhotoCredits);

  const syncCredits = React.useCallback(async () => {
    try {
      const c = await refreshPhotoCreditsForSession();
      if (c !== null) {
        setPhotoCredits(c);
      }
    } catch {
      // 네트워크/미설정 시 무시 (설정·구독 화면에서 재시도 가능)
    }
  }, [setPhotoCredits]);

  React.useEffect(() => {
    getCurrentUserId()
      .then((id) => {
        setUserId(id);
        if (id && !CONFIG.SKIP_AUTH_FOR_DEV) {
          void syncCredits();
        }
      })
      .catch(() => setUserId(undefined));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (CONFIG.SKIP_AUTH_FOR_DEV) {
        return;
      }
      if (session?.user?.id) {
        setUserId(session.user.id);
        void syncCredits();
      } else {
        setUserId(undefined);
        setPhotoCredits(0);
      }
    });

    return () => data.subscription.unsubscribe();
  }, [setUserId, setPhotoCredits, syncCredits]);

  React.useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (url.includes("billing/success")) {
        void syncCredits();
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [syncCredits]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainTabs">
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
