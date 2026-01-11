import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import styles from './paywallStyles';

export default function Paywall({ navigation }) {
  const { setPremium } = useAuthStore();

  const handleSubscribe = () => {
    setPremium(true);
    navigation.goBack();
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

      <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
        <Text style={styles.buttonText}>ASSINAR PRO - R$ 9,90/mês</Text>
      </TouchableOpacity>
      
      <Text style={styles.footerText}>Cancele a qualquer momento.</Text>
    </ScrollView>
  );
}