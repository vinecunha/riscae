import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../../screens/Dashboard/styles';

export default function ListModal({ visible, onClose, onSave, initialValue, title }) {
  const [name, setName] = useState('');

  useEffect(() => { if (visible) setName(initialValue || ''); }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput 
            style={styles.input} 
            autoFocus 
            value={name} 
            onChangeText={setName} 
            placeholder="Ex: Rancho do Mês"
          />
          <TouchableOpacity style={styles.btnPrimary} onPress={() => onSave(name)}>
            <Text style={styles.btnText}>SALVAR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.btnCancel}>CANCELAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}