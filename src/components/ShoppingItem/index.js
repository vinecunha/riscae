import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useCartStore } from '../../store/cartStore';
import styles from './styles';

export default function ShoppingItem({ item, onConfirm, onRemove }) {
  const updateItemType = useCartStore((state) => state.updateItemType);
  const reopenItem = useCartStore((state) => state.reopenItem);
  
  const [val1, setVal1] = useState(item.price > 0 ? item.price.toString() : ''); 
  const [val2, setVal2] = useState(
    item.unitType === 'WEIGHT' 
      ? (item.amount * 1000).toString() 
      : item.amount > 0 ? item.amount.toString() : '1'
  ); 
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    if (val1 && val2) {
      const p = parseFloat(val1.replace(',', '.'));
      const q = item.unitType === 'WEIGHT' 
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
      "O que deseja fazer com este item?",
      [
        { 
          text: "Alterar", 
          onPress: () => {
            reopenItem(item.id);
            setIsEditing(true);
          } 
        },
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
            <Text style={{ fontSize: 9, color: '#46C68E', fontWeight: '900', letterSpacing: 0.5 }}>✓ CONCLUÍDO</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B' }}>
            R$ {(item.price * item.amount).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, isEditing && { borderColor: '#1A1C2E', borderWidth: 1.5, shadowOpacity: 0.1 }]}>
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => setIsEditing(!isEditing)} 
        style={styles.itemHeader}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>
            {item.unitType === 'UNIT' ? 'Unidade' : 'Peso/Kg'}
          </Text>
        </View>
        <View style={{ backgroundColor: isEditing ? '#1A1C2E' : '#F1F5F9', width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: isEditing ? '#FFF' : '#64748B' }}>{isEditing ? '✕' : 'R$'}</Text>
        </View>
      </TouchableOpacity>

      {isEditing && (
        <View style={{ marginTop: 15 }}>
          <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 16 }}>
            <TouchableOpacity 
              onPress={() => updateItemType(item.id, 'UNIT')}
              style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, item.unitType === 'UNIT' && { backgroundColor: '#FFF', elevation: 2 }]}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: item.unitType === 'UNIT' ? '#1A1C2E' : '#94A3B8' }}>UNIDADE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => updateItemType(item.id, 'WEIGHT')}
              style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, item.unitType === 'WEIGHT' && { backgroundColor: '#FFF', elevation: 2 }]}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: item.unitType === 'WEIGHT' ? '#1A1C2E' : '#94A3B8' }}>PESO/KG</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 5, marginLeft: 5 }}>PREÇO</Text>
              <TextInput 
                style={[styles.input, { height: 50, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }]} 
                placeholder="0,00" 
                keyboardType="numeric" 
                value={val1}
                onChangeText={setVal1}
                autoFocus
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 5, marginLeft: 5 }}>
                {item.unitType === 'UNIT' ? "QTD" : "GRAMAS"}
              </Text>
              <TextInput 
                style={[styles.input, { height: 50, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }]} 
                placeholder={item.unitType === 'UNIT' ? "1" : "1000"} 
                keyboardType="numeric" 
                value={val2}
                onChangeText={setVal2}
              />
            </View>
            <TouchableOpacity 
              style={{ backgroundColor: '#46C68E', width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }} 
              onPress={handleConfirm}
            >
              <Text style={{ color: '#FFF', fontSize: 22, fontWeight: 'bold' }}>✓</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => onRemove(item.id)} 
            style={{ marginTop: 20, alignSelf: 'center', padding: 10 }}
          >
            <Text style={{ color: '#FF6B6B', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>REMOVER ITEM</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}