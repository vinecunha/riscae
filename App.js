import React, { useEffect } from 'react';
import { Platform, LogBox, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import { useAuthStore } from './src/store/authStore';

import Dashboard from './src/screens/Dashboard';
import ShoppingList from './src/screens/ShoppingList';
import History from './src/screens/History';
import Receipt from './src/screens/History/receipt';
import Paywall from './src/screens/Premium/Paywall';
import PriceIntelligence from './src/screens/Premium/PriceIntelligence';
import ScanReceipt from './src/screens/ScanReceipt';
import Premium from './src/screens/Subscription/index';
import BackupScreen from './src/screens/Backup/index';
import ProfileScreen from './src/screens/Profile/index';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const Stack = createStackNavigator();

export default function App() {
  const { setPremium } = useAuthStore();

  useEffect(() => {
    const setupPurchases = async () => {
      try {
        await Purchases.configure({ apiKey: "test_OBsTXXbthpnBZQLabNcSHMjvHln" });

        const customerInfo = await Purchases.getCustomerInfo();
        
        const isPro = typeof customerInfo.entitlements.active['RISCAÊ Pro'] !== "undefined";
        setPremium(isPro);
        
        console.log("=========================================");
        console.log("REVENUECAT INICIADO (ID DINÂMICO)");
        console.log("ID USUÁRIO:", customerInfo.originalAppUserId);
        console.log("STATUS PREMIUM:", isPro ? "ATIVO ✅" : "INATIVO ❌");
        console.log("=========================================");
      } catch (e) {
        console.log("Erro na configuração:", e);
      }
    };

    setupPurchases();

    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        Purchases.getCustomerInfo().then((info) => {
          const isActive = info.entitlements.active['RISCAÊ Pro'] !== undefined;
          setPremium(isActive);
          console.log("App retomado - Status Premium:", isActive ? "ATIVO ✅" : "INATIVO ❌");
        });
      }
    });

    return () => {
      appStateListener.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
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
          <Stack.Screen name="Premium" component={Premium} />
          <Stack.Screen name="PriceIntelligence" component={PriceIntelligence} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen 
            name="Paywall" 
            component={Paywall} 
            options={{ 
              cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS, 
              gestureEnabled: true 
            }} 
          />
          <Stack.Screen 
            name="Backup" 
            component={BackupScreen} 
            options={{ headerShown: false }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}