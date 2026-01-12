import React, { useState, useEffect } from 'react';
import { Platform, LogBox, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import * as Linking from 'expo-linking';
import { useAuthStore } from './src/store/authStore';
import { supabase } from './src/services/supabase';

// Telas
import Login from './src/screens/Login';
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
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Configuração de Deep Link para o Magic Link do e-mail
  const prefix = Linking.createURL('/');
  const linking = {
    prefixes: [prefix, 'riscae://'],
    config: {
      screens: {
        Dashboard: 'login-callback',
      },
    },
  };

  useEffect(() => {
    // 1. Monitorar Autenticação (Supabase)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 2. Monitorar Compras (RevenueCat)
    const setupPurchases = async () => {
      try {
        await Purchases.configure({ apiKey: "test_OBsTXXbthpnBZQLabNcSHMjvHln" });
        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = typeof customerInfo.entitlements.active['RISCAÊ Pro'] !== "undefined";
        setPremium(isPro);
      } catch (e) {
        console.log("Erro na configuração RevenueCat:", e);
      }
    };

    setupPurchases();

    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        Purchases.getCustomerInfo().then((info) => {
          const isActive = info.entitlements.active['RISCAÊ Pro'] !== undefined;
          setPremium(isActive);
        });
      }
    });

    return () => {
      appStateListener.remove();
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  if (loadingAuth) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false, 
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS 
          }}
        >
          {session ? (
            // Grupo de Telas Autenticadas
            <>
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
              <Stack.Screen name="Backup" component={BackupScreen} />
            </>
          ) : (
            // Tela de Login (Aparece apenas se não estiver logado)
            <Stack.Screen name="Login" component={Login} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}