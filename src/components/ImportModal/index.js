import React from 'react';
import { Modal, View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard'; // Alterado aqui
import { parseRiscaeCode } from '../../services/importService';
import styles from '../../screens/Dashboard/styles';

export default function ImportModal({ visible, onClose, onImportSuccess }) {
  const handleClipboard = async () => {
    // No expo-clipboard a função é getStringAsync()
    const content = await Clipboard.getStringAsync(); 
    const result = parseRiscaeCode(content);

    if (result) {
      onImportSuccess(result.list, result.items);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", "Nenhuma lista válida encontrada no seu teclado.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Importar Lista</Text>
          <Text style={styles.modalSubtitle}>Copie a mensagem da lista enviada para você e clique no botão abaixo.</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleClipboard}>
            <Text style={styles.btnText}>COLAR CÓDIGO</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.btnCancel}>CANCELAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}