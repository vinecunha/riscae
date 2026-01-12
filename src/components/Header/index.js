import React from 'react';
import { View, Image, Text, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import styles from './styles';

export default function Header({ isPremium, navigation, onImport }) {
  return (
    <SafeAreaView style={{ backgroundColor: '#FFF' }}>
      <View style={[
        styles.headerContainer, 
        { 
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 15
        }
      ]}>
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

        <View style={[styles.actions, { flexDirection: 'row', alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.navigate('ScanReceipt')} style={styles.iconBtn}>
            <Text style={{ fontSize: 20 }}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.iconBtn}>
            <Text style={{ fontSize: 20 }}>🕒</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconBtn}>
            <Text style={{ fontSize: 20 }}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onImport} style={[styles.importBtn, { marginLeft: 5 }]}>
            <Text style={[styles.importIcon, { fontSize: 20 }]}>📥</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}