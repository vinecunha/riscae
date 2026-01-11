import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

import Dashboard from './src/screens/Dashboard';
import ShoppingList from './src/screens/ShoppingList';
import History from './src/screens/History';
import Receipt from './src/screens/History/receipt';
import Paywall from './src/screens/Premium/Paywall';
import PriceIntelligence from './src/screens/Premium/PriceIntelligence';
import ScanReceipt from './src/screens/ScanReceipt';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Dashboard"
        screenOptions={{ 
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
        }}
      >
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Items" component={ShoppingList} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="Receipt" component={Receipt} />
        <Stack.Screen name="ScanReceipt" component={ScanReceipt} />
        
        <Stack.Screen name="PriceIntelligence" component={PriceIntelligence} />
        <Stack.Screen 
          name="Paywall" 
          component={Paywall} 
          options={{ 
            cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
            gestureEnabled: true
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}