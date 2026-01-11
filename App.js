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

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const Stack = createStackNavigator();

export default function App() {
  const { setPremium } = useAuthStore();

  useEffect(() => {
    const setupPurchases = async () => {
      try {
        // Usando chave de teste diretamente conforme solicitado
        await Purchases.configure({ apiKey: "test_OBsTXXbthpnBZQLabNcSHMjvHln" });

        // O RevenueCat gera automaticamente um ID anônimo se não fizermos login.
        // Pegamos as informações atuais do cliente aqui.
        const customerInfo = await Purchases.getCustomerInfo();
        
        const isPro = typeof customerInfo.entitlements.active['RISCAÊ Pro'] !== "undefined";
        setPremium(isPro); // <--- ATUALIZA O ESTADO GLOBAL DO APP
        
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

    // Atualiza o status sempre que o app voltar para o primeiro plano (abrir)
    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        Purchases.getCustomerInfo().then((info) => {
          const isActive = info.entitlements.active['RISCAÊ Pro'] !== undefined;
          setPremium(isActive); // <--- ATUALIZA AO VOLTAR PARA O APP
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
    </SafeAreaProvider>
  );
}