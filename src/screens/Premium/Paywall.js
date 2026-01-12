import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Purchases from 'react-native-purchases';
import { useAuthStore } from '../../store/authStore';
import styles from './paywallStyles';

export default function Paywall({ navigation }) {
  const { setPremium } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Função para comprar o plano
  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        const { customerInfo } = await Purchases.purchasePackage(offerings.current.availablePackages[0]);
        if (typeof customerInfo.entitlements.active['RISCAÊ Pro'] !== "undefined") {
          setPremium(true);
          navigation.goBack();
        }
      }
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert("Erro", "Não foi possível processar a compra.");
      }
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÃO PARA RESTAURAR COMPRAS (Essencial para o seu caso agora)
  const handleRestore = async () => {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active['RISCAÊ Pro'] !== "undefined") {
        setPremium(true);
        Alert.alert("Sucesso", "Sua assinatura Pro foi restaurada!");
        navigation.goBack();
      } else {
        Alert.alert("Aviso", "Nenhuma assinatura ativa encontrada para esta conta de loja.");
      }
    } catch (e) {
      Alert.alert("Erro", "Erro ao tentar restaurar compras.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
        <Text style={{ fontSize: 24 }}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.emoji}>🚀</Text>
      <Text style={styles.title}>RISCAÊ PRO</Text>
      <Text style={styles.subtitle}>Economize tempo e dinheiro em cada compra.</Text>

      <View style={styles.benefits}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>💰</Text>
          <View>
            <Text style={styles.benefitTitle}>Comparador de Preços</Text>
            <Text style={styles.benefitDesc}>Saiba qual mercado da sua região é o mais barato.</Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>📊</Text>
          <View>
            <Text style={styles.benefitTitle}>Relatórios Mensais</Text>
            <Text style={styles.benefitDesc}>Veja quanto você economizou no final do mês.</Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>☁️</Text>
          <View>
            <Text style={styles.benefitTitle}>Backup Ilimitado</Text>
            <Text style={styles.benefitDesc}>Sincronize suas listas em múltiplos dispositivos.</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#46C68E" style={{ marginVertical: 20 }} />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
            <Text style={styles.buttonText}>ASSINAR PRO - R$ 9,90/mês</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginTop: 20, padding: 10 }} 
            onPress={handleRestore}
          >
            <Text style={{ color: '#64748B', fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}>
              RESTAURAR COMPRAS
            </Text>
          </TouchableOpacity>
        </>
      )}
      
      <Text style={styles.footerText}>Cancele a qualquer momento.</Text>
    </ScrollView>
  );
}