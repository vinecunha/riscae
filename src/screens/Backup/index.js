import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useCartStore } from '../../store/cartStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';

export default function BackupScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const { uploadBackup, restoreBackup } = useCartStore();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) {
      console.log(e);
    }
  };

  const handleBackup = async () => {
    if (!isPremium) {
      navigation.navigate('Premium');
      return;
    }

    setLoading(true);
    const result = await uploadBackup();
    setLoading(false);

    if (result === "SUCCESS") {
      Alert.alert("Sucesso", "Backup realizado na nuvem!");
    } else {
      Alert.alert("Erro", "Não foi possível salvar o backup.");
    }
  };

  const handleRestore = async () => {
    if (!isPremium) {
      navigation.navigate('Premium');
      return;
    }

    Alert.alert(
      "Atenção", 
      "Isso irá substituir suas listas atuais. Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Restaurar", 
          onPress: async () => {
            setLoading(true);
            const result = await restoreBackup();
            setLoading(false);

            if (result === "SUCCESS") {
              Alert.alert("Sucesso", "Dados restaurados!");
            } else if (result === "NO_BACKUP") {
              Alert.alert("Aviso", "Nenhum backup encontrado na nuvem.");
            } else {
              Alert.alert("Erro", "Falha na restauração.");
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ padding: 25, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Text style={{ fontSize: 18 }}>⬅️</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', marginLeft: 15, color: '#1A1C2E' }}>Backup na Nuvem</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <View style={{ backgroundColor: '#FFF', padding: 25, borderRadius: 25, elevation: 2, marginBottom: 20, borderTopWidth: 4, borderTopColor: '#46C68E' }}>
          <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 15 }}>💎</Text>
          <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 16, color: '#1A1C2E', marginBottom: 10 }}>Recurso Premium</Text>
          <Text style={{ textAlign: 'center', color: '#64748B', lineHeight: 20 }}>
            Usuários Premium mantêm seus dados seguros mesmo se trocarem de aparelho ou desinstalarem o app.
          </Text>
          
          {!isPremium && (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Premium')}
              style={{ marginTop: 20, backgroundColor: '#E8F7F0', padding: 12, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#46C68E', fontWeight: '900', fontSize: 12 }}>QUERO SER PREMIUM</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          onPress={handleBackup}
          disabled={loading}
          style={{ backgroundColor: '#1A1C2E', padding: 20, borderRadius: 18, alignItems: 'center', marginBottom: 15 }}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {!isPremium && <Text style={{ marginRight: 8 }}>🔒</Text>}
              <Text style={{ color: '#FFF', fontWeight: '800' }}>SALVAR NA NUVEM</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleRestore}
          disabled={loading}
          style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!isPremium && <Text style={{ marginRight: 8 }}>🔒</Text>}
            <Text style={{ color: '#64748B', fontWeight: '800' }}>RESTAURAR DA NUVEM</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}