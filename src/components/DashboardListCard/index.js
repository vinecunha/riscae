import React from 'react';
import { View, Text, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { generateRiscaeCode } from '../../services/importService';

export default function DashboardListCard({ item, items, onDelete, onEdit, onPress, UNIT_MAP }) {
  const listItems = items.filter(i => i.listId === item.id);
  const totalItems = listItems.length;
  const isComplete = totalItems > 0 && listItems.every(i => i.completed);
  const isEmpty = totalItems === 0;

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
    <TouchableOpacity onPress={onDelete} style={{ 
          backgroundColor: '#EF4444',
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
          height: '85%',
          marginTop: 4,
          marginHorizontal: 10,
          borderRadius: 16,
     }}>
      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 10 }}>EXCLUIR</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity 
        activeOpacity={0.7}
        onLongPress={onEdit}
        onPress={onPress}
        style={{ marginBottom: 12, marginHorizontal: 4 }}
      >
        <View 
          style={[
            { 
              backgroundColor: '#FFF', 
              padding: 18, 
              borderRadius: 24, 
              flexDirection: 'row', 
              alignItems: 'center', 
              borderWidth: 1.5,
              borderColor: 'transparent',
              // Shadow iOS
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              // Shadow Android
              elevation: 2,
            }, 
            isComplete && { borderColor: '#46C68E' },
            isEmpty && { 
              borderColor: '#CBD5E1', 
              borderStyle: 'dashed', 
              backgroundColor: '#F8FAFC', 
              elevation: 0, // Android bug: elevation mata o dashed
              shadowOpacity: 0 
            }
          ]}
        >
          <View style={{ 
            width: 45, 
            height: 45, 
            backgroundColor: isEmpty ? '#F1F5F9' : (isComplete ? '#E8F7F0' : '#F1F5F9'), 
            borderRadius: 15, 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginRight: 15 
          }}>
            <Text style={{ fontSize: 20 }}>{isEmpty ? '📭' : (isComplete ? '✅' : '📋')}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontWeight: '800', fontSize: 16, color: isEmpty ? '#94A3B8' : '#1A1C2E' }}>
                {item.name}
              </Text>
              {isEmpty && (
                <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#fff' }}>LISTA VAZIA</Text>
                </View>
              )}
            </View>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
              {isEmpty ? '⬅️ Arraste para excluir' : `R$ ${item.total?.toFixed(2).replace('.', ',') || "0,00"}`}
            </Text>
          </View>

          {!isEmpty && (
            <TouchableOpacity onPress={handleShareText} style={{ padding: 10 }}>
              <Text style={{ fontSize: 22 }}>📤</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}