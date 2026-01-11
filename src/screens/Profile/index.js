import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, 
  SafeAreaView, Dimensions, ActivityIndicator 
} from 'react-native';
import Purchases from 'react-native-purchases';
import { useCartStore } from '../../store/cartStore';
import Footer from '../../components/Footer';
import styles from './styles';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { history } = useCartStore(); // Lendo do history, onde os dados ficam após finishList
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  // Métrica 1: Soma o total de todas as compras finalizadas no histórico
  const totalGasto = history.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

  // Métrica 2: Soma a quantidade de itens comprados em todo o histórico
  const totalItens = history.reduce((acc, curr) => acc + (curr.completedCount || 0), 0);

  // Métrica 3: Estimativa de economia (8% sobre o gasto total)
  const estimativaEconomia = totalGasto * 0.08;

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#46C68E" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER COM BOTÃO VOLTAR */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 15,
        justifyContent: 'space-between'
      }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ padding: 10, backgroundColor: '#F1F5F9', borderRadius: 12 }}
        >
          <Text style={{ fontSize: 16 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontWeight: '900', color: '#1A1C2E' }}>MEU PAINEL</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.userName}>Inteligência de Gastos</Text>
          <View style={[styles.badge, { backgroundColor: isPremium ? '#1A1C2E' : '#F1F5F9' }]}>
            <Text style={[styles.badgeText, { color: isPremium ? '#46C68E' : '#64748B' }]}>
              {isPremium ? '🚀 PLANO PRO ATIVO' : 'PLANO GRATUITO'}
            </Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={[styles.cardSmall, { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }]}>
            <Text style={styles.cardEmoji}>💰</Text>
            <Text style={styles.cardLabel}>TOTAL GASTO</Text>
            <Text style={styles.cardValue}>R$ {totalGasto.toFixed(2)}</Text>
          </View>

          <View style={[styles.cardSmall, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
            <Text style={styles.cardEmoji}>📈</Text>
            <Text style={styles.cardLabel}>ECONOMIA EST.</Text>
            <Text style={[styles.cardValue, { color: '#15803D' }]}>R$ {estimativaEconomia.toFixed(2)}</Text>
          </View>

          <View style={styles.cardLarge}>
            <View>
              <Text style={styles.cardLabel}>ITENS COMPRADOS (TOTAL)</Text>
              <Text style={[styles.cardValue, { fontSize: 24 }]}>{totalItens}</Text>
            </View>
            <Text style={{ fontSize: 30 }}>🛒</Text>
          </View>
        </View>

        {!isPremium && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Paywall')}
            style={styles.premiumBanner}
          >
            <Text style={styles.premiumTitle}>Desbloquear Inteligência 💎</Text>
            <Text style={styles.premiumSubtitle}>
              Analise seus gastos por mercado e receba alertas de preços baixos.
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESTATÍSTICAS DO HISTÓRICO</Text>
          
          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Compras Realizadas</Text>
            <Text style={{ fontWeight: '800', color: '#1A1C2E' }}>{history.length}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Paywall')}
            style={styles.rowItem}
          >
            <Text style={styles.rowLabel}>Gerenciar Assinatura</Text>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      <Footer hideProfileButton={true} />
    </SafeAreaView>
  );
}