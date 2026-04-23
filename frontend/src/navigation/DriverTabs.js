import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import VoiceScreen from '../screens/passenger/VoiceScreen';

const Tab = createBottomTabNavigator();

export default function DriverTabs({ route }) {
  const { gender } = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={({ route: tabRoute }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryGreen,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (tabRoute.name === 'DriverHome') iconName = 'car-outline';
          else if (tabRoute.name === 'Voice') iconName = 'mic-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        initialParams={{ gender }}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Voice"
        component={VoiceScreen}
        options={{ tabBarLabel: 'Voice' }}
      />
    </Tab.Navigator>
  );
}