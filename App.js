import React, { useState, useEffect } from 'react';
import { Platform, LogBox, AppState, View, ActivityIndicator } from 'react-native';
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

  // Configuração de Deep Link
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
    // 1. Função para verificar sessão inicial e configurar compras
    const initializeApp = async () => {
      try {
        // Verifica se já existe um usuário logado
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);

        // Configura RevenueCat
        await Purchases.configure({ apiKey: "test_OBsTXXbthpnBZQLabNcSHMjvHln" });

        if (initialSession?.user) {
          await Purchases.logIn(initialSession.user.id);
          const customerInfo = await Purchases.getCustomerInfo();
          setPremium(typeof customerInfo.entitlements.active['RISCAÊ Pro'] !== "undefined");
        }
      } catch (e) {
        console.log("Erro na inicialização:", e);
      } finally {
        // LIBERA A TELA (Sai do estado branco)
        setLoadingAuth(false);
      }
    };

    initializeApp();

    // 2. Ouvinte de mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        await Purchases.logIn(currentSession.user.id);
      }
    });

    // 3. Ouvinte de estado do App (para atualizar premium ao voltar ao app)
    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && session?.user) {
        Purchases.getCustomerInfo().then((info) => {
          setPremium(info.entitlements.active['RISCAÊ Pro'] !== undefined);
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      appStateListener.remove();
    };
  }, []);

  // Tela de carregamento para evitar o branco absoluto
  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#1A1C2E" />
      </View>
    );
  }

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
            <Stack.Screen name="Login" component={Login} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}