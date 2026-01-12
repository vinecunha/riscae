import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useCartStore } from '../../store/cartStore';
import styles from './styles';

export default function ShoppingItem({ item, onConfirm, onRemove, onReopen, suggestedPrice }) {
  const [val1, setVal1] = useState(item.price > 0 ? item.price.toString() : ''); 
  const [val2, setVal2] = useState(
    item.unitType === 'KG' || item.unitType === 'WEIGHT' 
      ? (item.amount * 1000).toString() 
      : item.amount > 0 ? item.amount.toString() : '1'
  ); 
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (suggestedPrice && !item.completed && val1 === '') {
      setVal1(suggestedPrice.toString());
    }
  }, [suggestedPrice]);

  // Sincroniza o valor de val2 se o item mudar (ex: ao reabrir ou trocar tipo)
  useEffect(() => {
    if (item.unitType === 'KG' || item.unitType === 'WEIGHT') {
      setVal2((item.amount * 1000).toString());
    } else {
      setVal2(item.amount.toString());
    }
  }, [item.unitType, item.amount]);

  const handleQuickConfirm = () => {
    const priceToUse = suggestedPrice || (val1 ? parseFloat(val1.replace(',', '.')) : 0);
    const amountToUse = (item.unitType === 'KG' || item.unitType === 'WEIGHT')
      ? parseFloat(val2.replace(',', '.')) / 1000 
      : parseFloat(val2.replace(',', '.'));
    
    onConfirm(item.id, priceToUse, amountToUse);
  };

  const handleConfirmManual = () => {
    if (val1 && val2) {
      const p = parseFloat(val1.replace(',', '.'));
      const q = (item.unitType === 'KG' || item.unitType === 'WEIGHT')
        ? parseFloat(val2.replace(',', '.')) / 1000 
        : parseFloat(val2.replace(',', '.'));
      
      if (p >= 0 && q > 0) {
        onConfirm(item.id, p, q);
        setIsEditing(false);
      }
    }
  };

  const handleOptions = () => {
    Alert.alert(
      item.name,
      "O que deseja fazer?",
      [
        { text: "Editar", onPress: () => { onReopen(item.id); setIsEditing(true); } },
        { text: "Apagar", onPress: () => onRemove(item.id), style: "destructive" },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  if (item.completed) {
    return (
      <TouchableOpacity 
        onPress={handleOptions}
        activeOpacity={0.6}
        style={[styles.card, { opacity: 0.6, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderColor: '#E2E8F0', elevation: 0 }]}
      >
        <View style={styles.itemHeader}>
          <View>
            <Text style={[styles.itemName, { textDecorationLine: 'line-through', color: '#64748B' }]}>{item.name}</Text>
            <Text style={{ fontSize: 9, color: '#46C68E', fontWeight: '900' }}>✓ CONCLUÍDO</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B' }}>
            R$ {(item.price * item.amount).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, isEditing && { borderColor: '#1A1C2E', borderWidth: 1.5 }]}>
      <View style={styles.itemHeader}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>
            {item.unitType === 'UNIT' ? 'Unidade' : 'Peso/Kg'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleQuickConfirm}
          style={{ backgroundColor: '#46C68E', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 18, color: '#FFF' }}>✓</Text>
        </TouchableOpacity>
      </View>

      {isEditing && (
        <View style={{ marginTop: 15 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 5 }}>PREÇO (R$)</Text>
              <TextInput 
                style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, fontWeight: 'bold' }}
                placeholder="0,00"
                keyboardType="numeric"
                value={val1}
                onChangeText={setVal1}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 5 }}>
                {(item.unitType === 'KG' || item.unitType === 'WEIGHT') ? 'GRAMAS' : 'QUANTIDADE'}
              </Text>
              <TextInput 
                style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, fontWeight: 'bold' }}
                placeholder={(item.unitType === 'KG' || item.unitType === 'WEIGHT') ? '500' : '1'}
                keyboardType="numeric"
                value={val2}
                onChangeText={setVal2}
              />
            </View>
          </View>
          <TouchableOpacity 
            onPress={handleConfirmManual}
            style={{ backgroundColor: '#1A1C2E', padding: 15, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#FFF', fontWeight: '900' }}>CONFIRMAR VALORES</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}