import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import PaymentScreen from '../screens/passenger/PaymentScreen';
import AuthScreen from '../screens/AuthScreen';
import OTPScreen from '../screens/OTPScreen';
import DriverUploadScreen from '../screens/rider/DriverUploadScreen';
import DriverPendingScreen from '../screens/rider/DriverPendingScreen';
import DriverAuthScreen from '../screens/rider/DriverAuthScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="DriverUpload" component={DriverUploadScreen} />
      <Stack.Screen name="DriverPending" component={DriverPendingScreen} />
      <Stack.Screen name="DriverAuth" component={DriverAuthScreen} />
    </Stack.Navigator>
  );
}