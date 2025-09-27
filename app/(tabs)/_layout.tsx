import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TabBar } from '../../components/layout/TabBar';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('navigation.map'),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t('navigation.add'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('navigation.messages'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
        }}
      />
    </Tabs>
  );
}