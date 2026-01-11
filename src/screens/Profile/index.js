import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, 
  SafeAreaView, Dimensions, ActivityIndicator, StatusBar, Platform
} from 'react-native';
import Purchases from 'react-native-purchases';
import { useCartStore } from '../../store/cartStore';
import Footer from '../../components/Footer';
import styles from './styles';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { history } = useCartStore();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalGasto = useMemo(() => 
    history.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0), 
  [history]);

  const totalItens = useMemo(() => 
    history.reduce((acc, curr) => acc + (Number(curr.completedCount) || 0), 0), 
  [history]);

  const estimativaEconomia = totalGasto * 0.08;

  const mercadosFrequentes = useMemo(() => {
    if (!history || history.length === 0) return [];
    const contagem = {};
    history.forEach(compra => {
      const nome = compra.market || "Mercado não identificado";
      contagem[nome] = (contagem[nome] || 0) + 1;
    });
    return Object.entries(contagem)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 3);
  }, [history]);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) {
      console.log("Erro RevenueCat:", e);
    } finally {
      setLoading(false);
    }
  };

  const LockedData = ({ value, color }) => (
    <View style={{ backgroundColor: isPremium ? 'transparent' : '#F1F5F9', borderRadius: 6, paddingHorizontal: isPremium ? 0 : 4 }}>
      <Text style={[styles.cardValue, { color: isPremium ? (color || '#1A1C2E') : '#94A3B8' }]}>
        {isPremium ? value : 'R$ ••••'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#46C68E" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER SIMPLIFICADO E AJUSTADO */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 25, 
        paddingTop: 20,
        paddingBottom: 15,
        justifyContent: 'space-between'
      }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ width: 45, height: 45, backgroundColor: '#F1F5F9', borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1C2E' }}>←</Text>
        </TouchableOpacity>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', color: '#1A1C2E', fontSize: 14, letterSpacing: 1 }}>MEU PAINEL</Text>
          <View style={{ backgroundColor: isPremium ? '#1A1C2E' : '#E2E8F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 }}>
            <Text style={{ color: isPremium ? '#46C68E' : '#64748B', fontSize: 9, fontWeight: '900' }}>
              {isPremium ? '👑 PLANO PRO' : '⚪ PLANO FREE'}
            </Text>
          </View>
        </View>

        <View style={{ width: 45 }} /> 
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        
        {/* TITULO DA SEÇÃO */}
        <View style={{ paddingHorizontal: 25, marginTop: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A1C2E' }}>Inteligência de Gastos</Text>
          <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500' }}>Acompanhe sua evolução e economia.</Text>
        </View>

        {/* GRID DE MÉTRICAS */}
        <View style={[styles.metricsGrid, { paddingHorizontal: 25 }]}>
          <View style={[styles.cardSmall, { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9', width: '48%' }]}>
            <Text style={styles.cardEmoji}>💰</Text>
            <Text style={styles.cardLabel}>TOTAL GASTO</Text>
            <LockedData value={`R$ ${totalGasto.toFixed(2)}`} />
          </View>

          <View style={[styles.cardSmall, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7', width: '48%' }]}>
            <Text style={styles.cardEmoji}>📈</Text>
            <Text style={styles.cardLabel}>ECONOMIA EST.</Text>
            <LockedData value={`R$ ${estimativaEconomia.toFixed(2)}`} color="#15803D" />
          </View>

          <View style={[styles.cardLarge, { marginHorizontal: 0, marginTop: 15, width: '100%' }]}>
            <View>
              <Text style={styles.cardLabel}>ITENS COMPRADOS NO TOTAL</Text>
              <Text style={[styles.cardValue, { fontSize: 28, color: isPremium ? '#1A1C2E' : '#94A3B8' }]}>
                {isPremium ? totalItens : '••'}
              </Text>
            </View>
            <Text style={{ fontSize: 35 }}>🛒</Text>
          </View>
        </View>

        {/* RANKING DE MERCADOS */}
        <View style={{ paddingHorizontal: 25, marginTop: 35 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#64748B', letterSpacing: 0.5 }}>MERCADOS MAIS FREQUENTADOS</Text>
            {!isPremium && <Text style={{ fontSize: 10, color: '#46C68E', fontWeight: 'bold' }}>PRO 💎</Text>}
          </View>

          {!isPremium ? (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Paywall')}
              style={{ padding: 30, backgroundColor: '#F8FAFC', borderRadius: 24, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' }}
            >
              <Text style={{ fontSize: 24, marginBottom: 10 }}>🔒</Text>
              <Text style={{ fontSize: 13, color: '#1A1C2E', fontWeight: '800', textAlign: 'center' }}>
                Ver ranking de mercados
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 5 }}>
                Assine o PRO para liberar esta análise.
              </Text>
            </TouchableOpacity>
          ) : mercadosFrequentes.length > 0 ? (
            mercadosFrequentes.map((item, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                padding: 18,
                borderRadius: 20,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#F1F5F9'
              }}>
                <View style={{ 
                  width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF',
                  alignItems: 'center', justifyContent: 'center', marginRight: 15,
                  elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
                }}>
                  <Text style={{ fontSize: 16 }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '900', color: '#1A1C2E', fontSize: 14 }}>{item.nome}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                    {item.qtd} {item.qtd === 1 ? 'compra realizada' : 'compras realizadas'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 30, backgroundColor: '#F8FAFC', borderRadius: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '700' }}>Finalize sua primeira lista para ver os dados.</Text>
            </View>
          )}
        </View>

        {/* BANNER PRO MELHORADO */}
        {!isPremium && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Paywall')}
            style={[styles.premiumBanner, { marginHorizontal: 25, marginTop: 30, padding: 20, borderRadius: 24, backgroundColor: '#1A1C2E' }]}
          >
            <Text style={{ color: '#46C68E', fontWeight: '900', fontSize: 16 }}>Desbloquear Inteligência 💎</Text>
            <Text style={{ color: '#FFF', fontSize: 12, marginTop: 5, opacity: 0.8 }}>
              Sincronize dados e compare preços entre mercados locais.
            </Text>
          </TouchableOpacity>
        )}

        {/* STATS GERAIS */}
        <View style={{ paddingHorizontal: 25, marginTop: 35 }}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: '#64748B', letterSpacing: 0.5, marginBottom: 15 }}>CONFIGURAÇÕES</Text>
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 24, padding: 5 }}>
            <View style={[styles.rowItem, { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingHorizontal: 20 }]}>
              <Text style={styles.rowLabel}>Listas Completadas</Text>
              <Text style={{ fontWeight: '800', color: '#1A1C2E' }}>{history.length}</Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('Paywall')}
              style={[styles.rowItem, { paddingHorizontal: 20 }]}
            >
              <Text style={styles.rowLabel}>Gerenciar Assinatura</Text>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
      <Footer hideProfileButton={true} />
    </SafeAreaView>
  );
}