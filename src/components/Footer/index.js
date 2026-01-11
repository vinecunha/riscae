import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';

export default function Footer() {
  return (
    <View style={{ 
      paddingVertical: 20, 
      alignItems: 'center', 
      width: '100%',
      backgroundColor: 'transparent'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 40 }}>
        <View style={{ height: 1, backgroundColor: '#E2E8F0', flex: 1 }} />
        <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', marginHorizontal: 15, letterSpacing: 2, textDecorationLine: 'line-through' }}>RISCAÊ</Text>
        <View style={{ height: 1, backgroundColor: '#E2E8F0', flex: 1 }} />
      </View>
      <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '600' }}>© 2026 - TODOS OS DIREITOS RESERVADOS</Text>
      <TouchableOpacity onPress={() => Linking.openURL('https://github.com/vinecunha')}>
        <Text style={{ fontSize: 11, color: '#3B82F6', fontWeight: '700', marginTop: 5 }}>Desenvolvido por @vinecunha</Text>
      </TouchableOpacity>
    </View>
  );
}