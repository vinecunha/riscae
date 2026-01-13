import React, { useState, useEffect } from 'react';
import { Platform, LogBox, AppState, View, ActivityIndicator, Image, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import * as Linking from 'expo-linking';
import { useAuthStore } from './src/store/authStore';
import { useCartStore } from './src/store/cartStore';
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
  const { history, setHistory } = useCartStore();
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  const prefix = Linking.createURL('/');
  const linking = {
    prefixes: [prefix, 'riscae://'],
    config: {
      screens: {
        Dashboard: 'login-callback',
      },
    },
  };

  // Efeito de Animação da Splash
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();

    // Remove a splash após 2.5 segundos
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const syncCloudLists = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_lists')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const cloudHistory = data.map(list => ({
          id: list.id,
          name: list.name,
          market: list.market,
          items: list.items,
          total: list.total,
          date: list.created_at,
          completedCount: list.items.filter(i => i.completed).length
        }));
        setHistory(cloudHistory);
      }
    } catch (e) {
      console.log("Erro no Restore Inteligente:", e.message);
    }
  };

  useEffect(() => {
    const performBackup = async () => {
      if (session?.user && history.length > 0) {
        try {
          const recentLists = history.slice(0, 5).map(list => ({
            user_id: session.user.id,
            name: list.name || 'Lista Sem Nome',
            market: list.market || '',
            items: list.items || [],
            total: list.total || 0,
            updated_at: new Date()
          }));
          await supabase.from('user_lists').upsert(recentLists, { onConflict: 'user_id, name' });
        } catch (e) {
          console.log("Erro no Backup Automático:", e);
        }
      }
    };
    performBackup();
  }, [history]);

  const updatePremiumStatus = async (user) => {
    if (!user) {
      setPremium(false);
      return;
    }
    try {
      const { customerInfo } = await Purchases.logIn(user.id);
      setPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) {
      console.log("Erro ao sincronizar premium:", e);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);

        await Purchases.configure({ apiKey: "test_OBsTXXbthpnBZQLabNcSHMjvHln" });

        if (initialSession?.user) {
          await updatePremiumStatus(initialSession.user);
          await syncCloudLists(initialSession.user.id);
        }
      } catch (e) {
        console.log("Erro na inicialização:", e);
      } finally {
        setLoadingAuth(false);
      }
    };

    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (event === 'SIGNED_IN' && currentSession?.user) {
        await updatePremiumStatus(currentSession.user);
        await syncCloudLists(currentSession.user.id);
      }
      if (event === 'SIGNED_OUT') {
        setPremium(false);
        setHistory([]);
        await Purchases.logOut();
      }
    });

    const appStateListener = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          await updatePremiumStatus(currentSession.user);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      appStateListener.remove();
    };
  }, []);

  // Tela de Splash Customizada
  if (showSplash || loadingAuth) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <Image 
            source={require('./src/assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <ActivityIndicator size="small" color="#46C68E" style={{ marginTop: 20 }} />
        </Animated.View>
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

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC', // Cor baseada na logo (Azul Marinho)
  },
  logo: {
    width: 250,
    height: 100,
  }
});