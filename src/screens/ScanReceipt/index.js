import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../../services/supabase';
import styles from './styles';

export default function ScanReceipt({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      // 1. Validar se é uma URL da SEFAZ
      if (!data.includes('fazenda.rj.gov.br')) {
        Alert.alert("Erro", "Este QR Code não pertence a uma Nota Fiscal do RJ.", [{ text: "Tentar novamente", onPress: () => setScanned(false) }]);
        setLoading(false);
        return;
      }

      // 2. Chamar a função de processamento (Edge Function)
      // Nota: Esta função 'process-receipt' deve ser criada no seu painel do Supabase
      const { data: result, error } = await supabase.functions.invoke('process-receipt', {
        body: { url: data }
      });

      if (error) throw error;

      // 3. Sucesso!
      Alert.alert(
        "Nota Processada! 🚀", 
        `Encontramos ${result.items.length} produtos no ${result.marketName}. Deseja atualizar seus preços?`,
        [
          { text: "Agora não", onPress: () => navigation.goBack() },
          { 
            text: "Sim, Atualizar", 
            onPress: () => {
              // Aqui chamaremos a lógica para atualizar o histórico de preços
              navigation.goBack();
            } 
          }
        ]
      );

    } catch (error) {
      console.error(error);
      Alert.alert("Erro de Leitura", "Não conseguimos extrair os dados desta nota no momento.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <View style={styles.container}><ActivityIndicator size="large" color="#46C68E" /></View>;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#FFF', textAlign: 'center', marginBottom: 20, paddingHorizontal: 40 }}>
          O Riscaê precisa da sua câmera para ler o QR Code da nota fiscal.
        </Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={requestPermission}>
          <Text style={styles.cancelText}>CONCEDER PERMISSÃO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.focusFrame} />
        <Text style={styles.scanText}>Aponte para o QR Code da Nota</Text>
        {loading && (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <ActivityIndicator size="large" color="#46C68E" />
            <Text style={{ color: '#46C68E', fontWeight: 'bold', marginTop: 10 }}>CONSULTANDO SEFAZ...</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.cancelBtn} 
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.cancelText}>CANCELAR</Text>
      </TouchableOpacity>
    </View>
  );
}