import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function DashboardHeader({ isPremium, navigation, onImport }) {
  return (
    <View style={styles.headerContainer}>
      <View>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={[styles.badge, { backgroundColor: isPremium ? '#FFF9E6' : '#F1F5F9' }]}>
          <Text style={styles.badgeText}>{isPremium ? '👑 RISCAÊ PRO' : '⚪ RISCAÊ FREE'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('ScanReceipt')} style={styles.iconBtn}><Text>📷</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.iconBtn}><Text>🕒</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconBtn}><Text>👤</Text></TouchableOpacity>
        <TouchableOpacity onPress={onImport} style={styles.importBtn}><Text style={styles.importIcon}>📥</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  logo: { width: 90, height: 35 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 5 },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#64748B' },
  actions: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 5, elevation: 2, alignItems: 'center' },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  importBtn: { backgroundColor: '#1A1C2E', width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 5 },
  importIcon: { fontSize: 16, color: '#FFF' }
});