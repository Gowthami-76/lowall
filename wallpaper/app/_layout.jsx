import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="premium-booking" />
        <Stack.Screen name="wallpaper/[id]" />
        <Stack.Screen name="comments/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="settings" />
       <Stack.Screen name="wallpaper/edit-profile"/>
       <Stack.Screen name="wallpaper/change-password"/>
       <Stack.Screen name="wallpaper/help"/>
       <Stack.Screen name="wallpaper/terms"/>
       <Stack.Screen name="wallpaper/privacy"/>

        <Stack.Screen name="search" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}