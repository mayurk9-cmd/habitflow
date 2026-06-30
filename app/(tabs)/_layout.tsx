import { Tabs } from 'expo-router';
import { PRIMARY, TEXT, MUTED, BORDER } from '../../constants/theme';
import { Platform, Text } from 'react-native';

function TabIcon({ label, active }: { label: string; active: boolean }) {
  const icons: Record<string, [string, string]> = {
    index:      ['🏠', '🏡'],
    challenges: ['🎯', '🏆'],
    coach:      ['🤖', '✨'],
    stats:      ['📊', '📈'],
  };
  const [inactive, act] = icons[label] ?? ['●', '●'];
  return <Text style={{ fontSize: 22 }}>{active ? act : inactive}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: BORDER,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon label="index" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ focused }) => <TabIcon label="challenges" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'AI Coach',
          tabBarIcon: ({ focused }) => <TabIcon label="coach" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon label="stats" active={focused} />,
        }}
      />
    </Tabs>
  );
}
