import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import DriverTabs from './DriverTabs';
import PaymentScreen from '../screens/passenger/PaymentScreen';
import AuthScreen from '../screens/AuthScreen';
import OTPScreen from '../screens/OTPScreen';
import DriverUploadScreen from '../screens/driver/DriverUploadScreen';
import DriverPendingScreen from '../screens/driver/DriverPendingScreen';
import DriverAuthScreen from '../screens/driver/DriverAuthScreen';
import DriverRideRequestScreen from '../screens/driver/DriverRideRequestScreen';
import ActiveTripScreen from '../screens/passenger/ActiveTripScreen';
import DriverActiveTripScreen from '../screens/driver/DriverActiveTripScreen';
import TripHistoryScreen from '../screens/passenger/TripHistoryScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="DriverAuth" component={DriverAuthScreen} />
      <Stack.Screen name="DriverUpload" component={DriverUploadScreen} />
      <Stack.Screen name="DriverPending" component={DriverPendingScreen} />
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen name="DriverRideRequest" component={DriverRideRequestScreen} />
      <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <Stack.Screen name="DriverActiveTrip" component={DriverActiveTripScreen} />
      <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}