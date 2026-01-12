import React from 'react';
import { View, Text, TouchableOpacity, Share, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { generateRiscaeCode } from '../../services/importService';

export default function DashboardListCard({ item, items, onDelete, onEdit, onPress, UNIT_MAP }) {
  const listItems = items.filter(i => i.listId === item.id);
  const isComplete = listItems.length > 0 && listItems.every(i => i.completed);

  const handleShareText = async () => {
    try {
      const minified = [
        item.name, 
        item.total || 0,
        listItems.map(i => [i.name, UNIT_MAP[i.unitType] ?? 0, i.amount, i.price])
      ];

      const b64 = generateRiscaeCode(minified);
      const shareLink = `https://riscae.app/import?data=${b64}`;
      const message = `🛒 *Lista Riscaê: ${item.name}*\n\nCopie o link abaixo e abra o seu app Riscaê para importar:\n\n${shareLink}`;
      
      await Clipboard.setStringAsync(shareLink);
      await Share.share({ message });
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar link de compartilhamento.");
    }
  };

  const renderRightActions = () => (
    <TouchableOpacity onPress={onDelete} style={{ backgroundColor: '#FF7675', justifyContent: 'center', width: 70, borderRadius: 24, alignItems: 'center', marginBottom: 12, marginLeft: 10 }}>
      <Text style={{ fontSize: 20 }}>🗑️</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity 
        style={[{ backgroundColor: '#FFF', padding: 18, borderRadius: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 }, isComplete && { borderColor: '#46C68E', borderWidth: 1.5 }]}
        onLongPress={onEdit}
        onPress={onPress}
      >
        <View style={{ width: 45, height: 45, backgroundColor: isComplete ? '#E8F7F0' : '#F1F5F9', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
          <Text style={{ fontSize: 20 }}>{isComplete ? '✅' : '📋'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: '#1A1C2E' }}>{item.name}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12 }}>R$ {item.total?.toFixed(2) || "0.00"}</Text>
        </View>
        <TouchableOpacity onPress={handleShareText} style={{ padding: 10 }}>
          <Text style={{ fontSize: 22 }}>📤</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Swipeable>
  );
}