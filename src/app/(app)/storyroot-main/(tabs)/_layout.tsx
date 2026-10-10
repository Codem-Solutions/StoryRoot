import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/storyroot/components/FloatingTabBar';

export default function StoryRootTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => <FloatingTabBar />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="saude" />
      <Tabs.Screen name="rotina" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
