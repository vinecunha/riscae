import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import styles from './styles';

export default function DashboardHeader({ isPremium, navigation, onImport }) {
  return (
    <View style={styles.headerContainer}>
      <View>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('Premium')} 
          activeOpacity={0.7}
          style={[styles.badge, { backgroundColor: isPremium ? '#ff0' : '#F1F5F9' }]}
        >
          <Text style={styles.badgeText}>
            {isPremium ? '👑 RISCAÊ PRO' : '⚪ RISCAÊ FREE'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('ScanReceipt')} style={styles.iconBtn}>
          <Text>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.iconBtn}>
          <Text>🕒</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconBtn}>
          <Text>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onImport} style={styles.importBtn}>
          <Text style={styles.importIcon}>📥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}