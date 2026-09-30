import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PlaceholderScreen } from '../screens/Placeholder/PlaceholderScreen';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

function HomePlaceholder() {
  return <PlaceholderScreen title="Home" message="A home do profissional chega no Batch 2." />;
}

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomePlaceholder} />
    </Stack.Navigator>
  );
}
