import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Linking, 
  Platform,
  ActivityIndicator,
  Alert,
  Clipboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../services/supabase'; // Importe o seu supabase
import styles from './styles';

export default function Subscription({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [userEmail, setUserEmail] = useState(''); // Novo estado para o e-mail
  const isFocused = useIsFocused();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      
      // 1. Busca dados do RevenueCat
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      // 2. Busca e-mail do usuário no Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchStatus();
    }
  }, [isFocused]);

  const activeEntitlement = customerInfo?.entitlements.active['RISCAÊ Pro'];
  const isPremium = activeEntitlement !== undefined;

  const copyToClipboard = (text) => {
    if (!text) return;
    Clipboard.setString(text);
    Alert.alert("Copiado!", "ID do usuário copiado.");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Permanente';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleManageSubscription = () => {
    if (customerInfo?.managementURL) {
      Linking.openURL(customerInfo.managementURL);
    } else {
      const url = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/account/subscriptions' 
        : 'https://play.google.com/store/account/subscriptions';
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#1A1C2E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ padding: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 }}
        >
          <Text style={{ fontSize: 18 }}>⬅️</Text>
        </TouchableOpacity>
        <Text style={[styles.listName, { fontSize: 18 }]}>Assinatura</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <View style={{ backgroundColor: isPremium ? '#1A1C2E' : '#94A3B8', borderRadius: 30, padding: 25, alignItems: 'center', marginBottom: 30 }}>
          <View style={{ backgroundColor: isPremium ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, marginBottom: 15 }}>
            <Text style={{ color: isPremium ? '#FFD700' : '#FFF', fontWeight: '900', fontSize: 12 }}>
              {isPremium ? '👑 PLANO PREMIUM' : 'PLANO GRATUITO'}
            </Text>
          </View>
          <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 5 }}>
            {isPremium ? 'Status: Ativo' : 'Status: Inativo'}
          </Text>
          {isPremium && (
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 }}>
              {activeEntitlement.expirationDate 
                ? `Renovação em: ${formatDate(activeEntitlement.expirationDate)}`
                : 'Acesso Vitalício'}
            </Text>
          )}
        </View>

        <Text style={[styles.label, { marginBottom: 15, marginLeft: 5 }]}>Detalhes da conta</Text>
        <View style={styles.card}>
          {/* CAMPO DE E-MAIL ADICIONADO AQUI */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <Text style={{ color: '#64748B', fontWeight: '600' }}>E-mail</Text>
            <Text style={{ color: '#1A1C2E', fontWeight: '800' }}>{userEmail || 'Não logado'}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <Text style={{ color: '#64748B', fontWeight: '600' }}>Plano Atual</Text>
            <Text style={{ color: '#1A1C2E', fontWeight: '800' }}>
              {isPremium ? 'RISCAÊ Pro' : 'Básico'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <Text style={{ color: '#64748B', fontWeight: '600' }}>Início</Text>
            <Text style={{ color: '#1A1C2E', fontWeight: '800' }}>
              {formatDate(customerInfo?.firstSeen)}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => copyToClipboard(customerInfo?.originalAppUserId)}
            activeOpacity={0.6}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 }}
          >
            <View style={{ flex: 0.4 }}>
              <Text style={{ color: '#64748B', fontWeight: '600' }}>ID Usuário</Text>
            </View>
            <View style={{ flex: 0.6, alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#1A1C2E', fontWeight: '800', fontSize: 10, marginRight: 6 }} numberOfLines={1} ellipsizeMode="middle">
                  {customerInfo?.originalAppUserId}
                </Text>
                <Text style={{ fontSize: 12 }}>📋</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {isPremium ? (
          <TouchableOpacity 
            onPress={handleManageSubscription}
            style={{ backgroundColor: '#F1F5F9', paddingVertical: 20, borderRadius: 20, alignItems: 'center', marginTop: 30 }}
          >
            <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 14 }}>GERENCIAR ASSINATURA</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Paywall')}
            style={{ backgroundColor: '#46C68E', paddingVertical: 20, borderRadius: 20, alignItems: 'center', marginTop: 30 }}
          >
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>TORNE-SE PREMIUM</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}