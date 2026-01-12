import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ShoppingItem({ item, onConfirm, onRemove, onReopen, suggestedPrice, isFocusedMode }) {
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

  const toggleEditing = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsEditing(!isEditing);
  };

  const handleQuickConfirm = () => {
    const typedPrice = val1 ? parseFloat(val1.replace(',', '.')) : 0;
    const priceToUse = typedPrice > 0 ? typedPrice : (suggestedPrice || 0);
    
    const amountToUse = (item.unitType === 'KG' || item.unitType === 'WEIGHT')
      ? parseFloat(val2.replace(',', '.')) / 1000 
      : parseFloat(val2.replace(',', '.'));
    
    onConfirm(item.id, priceToUse, amountToUse);
    setIsEditing(false);
  };

  const adjustQuantity = (type) => {
    let current = parseFloat(val2) || 0;
    let step = (item.unitType === 'KG' || item.unitType === 'WEIGHT') ? 100 : 1;
    let newValue = type === 'add' ? current + step : Math.max(step, current - step);
    setVal2(newValue.toString());
  };

  // LAYOUT MODO FOCADO (COMPACTO MAS COM DADOS ESSENCIAIS)
  if (isFocusedMode && !item.completed) {
    return (
      <TouchableOpacity 
        onPress={handleQuickConfirm}
        onLongPress={toggleEditing}
        activeOpacity={0.8}
        style={{ 
          flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
          marginHorizontal: 20, marginVertical: 4, padding: 14, borderRadius: 16,
          borderWidth: 1, borderColor: '#F1F5F9', elevation: 2
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#1A1C2E' }}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginRight: 8 }}>
              {item.amount} {item.unitType === 'UNIT' ? 'un' : 'kg'}
            </Text>
            <Text style={{ fontSize: 12, color: '#46C68E', fontWeight: '600' }}>
              Est. R$ {( (parseFloat(val1) || suggestedPrice || 0) * item.amount).toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={{ backgroundColor: '#46C68E', width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, color: '#FFF', fontWeight: 'bold' }}>✓</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // LAYOUT ITEM CONCLUÍDO
  if (item.completed) {
    const isPayingMore = suggestedPrice && item.price > suggestedPrice;
    return (
      <TouchableOpacity 
        onLongPress={() => onRemove(item.id)}
        onPress={() => onReopen(item.id)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center', 
          backgroundColor: isPayingMore ? '#FEF2F2' : '#F8FAFC',
          marginHorizontal: 20, marginVertical: 4, padding: 12, 
          borderRadius: 16, borderWidth: 1, borderColor: isPayingMore ? '#FCA5A5' : '#E2E8F0',
          opacity: 0.9
        }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: isPayingMore ? '#EF4444' : '#46C68E', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: isPayingMore ? '#991B1B' : '#64748B', textDecorationLine: 'line-through' }}>{item.name}</Text>
          <Text style={{ fontSize: 10, color: isPayingMore ? '#B91C1C' : '#94A3B8', fontWeight: isPayingMore ? '700' : '400' }}>
            {item.amount} {item.unitType === 'UNIT' ? 'un' : 'kg'} • R$ {(item.price * item.amount).toFixed(2)}
            {isPayingMore && ` (Acima do esperado)`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // LAYOUT NORMAL (PADRÃO COM TODAS AS FUNÇÕES)
  return (
    <View style={{ 
      backgroundColor: '#FFF', marginHorizontal: 20, marginVertical: 6, borderRadius: 20, 
      padding: 16, elevation: 3, borderWidth: isEditing ? 2 : 1, 
      borderColor: isEditing ? '#1A1C2E' : '#F1F5F9' 
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={toggleEditing} activeOpacity={0.7}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1C2E', marginBottom: 2 }}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
              <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold' }}>{item.amount} {item.unitType === 'UNIT' ? 'UN' : 'KG'}</Text>
            </View>
            {(val1 !== '' || suggestedPrice) && (
              <Text style={{ fontSize: 12, color: '#46C68E', fontWeight: '700' }}>
                Est. R$ {val1 || suggestedPrice}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleQuickConfirm}
          style={{ backgroundColor: '#46C68E', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 22, color: '#FFF', fontWeight: 'bold' }}>✓</Text>
        </TouchableOpacity>
      </View>

      {isEditing && (
        <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 8 }}>PREÇO UNIT.</Text>
              <TextInput 
                style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, fontSize: 16, fontWeight: 'bold', color: '#1A1C2E', borderWidth: 1, borderColor: '#E2E8F0' }}
                placeholder="0,00"
                keyboardType="numeric"
                value={val1}
                onChangeText={setVal1}
              />
            </View>
            <View style={{ flex: 1.2 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 8 }}>
                {(item.unitType === 'KG' || item.unitType === 'WEIGHT') ? 'GRAMAS' : 'QTD'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <TouchableOpacity onPress={() => adjustQuantity('sub')} style={{ padding: 12 }}><Text style={{ fontSize: 20, fontWeight: 'bold' }}>-</Text></TouchableOpacity>
                <TextInput 
                  style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}
                  keyboardType="numeric"
                  value={val2}
                  onChangeText={setVal2}
                />
                <TouchableOpacity onPress={() => adjustQuantity('add')} style={{ padding: 12 }}><Text style={{ fontSize: 20, fontWeight: 'bold' }}>+</Text></TouchableOpacity>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            onPress={handleQuickConfirm}
            style={{ backgroundColor: '#1A1C2E', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 15 }}
          >
            <Text style={{ color: '#FFF', fontWeight: '900' }}>SALVAR ALTERAÇÕES</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}