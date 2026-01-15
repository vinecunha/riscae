import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FlatList, StatusBar, TouchableOpacity, Text, Alert, AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Importação correta para evitar o aviso de depreciação
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useIsFocused } from '@react-navigation/native';
import { useCartStore } from '../../store/cartStore';

import Header from '../../components/Header';
import DashboardListCard from '../../components/DashboardListCard';
import ImportModal from '../../components/ImportModal';
import ListModal from '../../components/ListModal';
import Footer from '../../components/Footer';
import { UNIT_MAP } from '../../services/importService';
import styles from './styles';

export default function Dashboard({ navigation }) {
  const { lists, items, addList, importList, removeList, updateListName, restoreBackup, processQueue } = useCartStore();
  const isFocused = useIsFocused();
  
  // Ref para evitar múltiplas chamadas simultâneas ao RevenueCat (Erro 429)
  const isCheckingPremium = useRef(false);
  
  const [isPremium, setIsPremium] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [listModal, setListModal] = useState({ visible: false, mode: 'create', data: null });
  const [lastSync, setLastSync] = useState(null);

  const checkClipboardForLink = async () => {
    try {
      const content = await Clipboard.getStringAsync();
      if (content.includes('riscae.app/import?data=')) {
        setTimeout(() => {
          setImportVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 500);
      }
    } catch (e) { console.log("Clipboard error"); }
  };

  const syncData = async () => {
    try {
      await processQueue();
      await restoreBackup(true);
      const now = new Date();
      setLastSync(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    } catch (e) { console.log("Sync error"); }
  };

  const checkPremiumStatus = async () => {
    if (isCheckingPremium.current) return;
    isCheckingPremium.current = true;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) { 
      // Silencia o log de erro 429 para não poluir o console
    } finally {
      isCheckingPremium.current = false;
    }
  };

  useEffect(() => {
    if (isFocused) {
      checkClipboardForLink();
      checkPremiumStatus();
      syncData();
    }
  }, [isFocused]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && isFocused) {
        checkClipboardForLink();
        await syncData();
      }
    });

    return () => subscription.remove();
  }, [isFocused]);

  const sortedLists = useMemo(() => {
    return [...lists].sort((a, b) => {
      const aItems = items.filter(i => i.listId === a.id);
      const bItems = items.filter(i => i.listId === b.id);
      
      if (aItems.length === 0 && bItems.length > 0) return 1;
      if (bItems.length === 0 && aItems.length > 0) return -1;

      const aDone = aItems.length > 0 && aItems.every(i => i.completed);
      const bDone = bItems.length > 0 && bItems.every(i => i.completed);
      return aDone === bDone ? 0 : aDone ? 1 : -1;
    });
  }, [lists, items]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* SafeAreaView do react-native-safe-area-context */}
      <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
        <StatusBar barStyle="dark-content" />
        <Header isPremium={isPremium} navigation={navigation} onImport={() => setImportVisible(true)} />
        
        {lastSync && (
          <View style={{ alignItems: 'center', paddingVertical: 4, backgroundColor: '#F8FAFC' }}>
            <Text style={{ fontSize: 8, color: '#94A3B866', fontWeight: 'bold' }}>☁️ BACKUP AUTOMÁTICO NA NUVEM SINCRONIZADA ÀS {lastSync}</Text>
          </View>
        )}

        <FlatList 
          data={sortedLists}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <DashboardListCard 
              item={item} 
              items={items}
              onDelete={() => {
                const listItems = items.filter(i => i.listId === item.id);
                if (listItems.length === 0) {
                  removeList(item.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                  Alert.alert("Excluir Lista", "Deseja remover esta lista e todos os itens?", [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Remover", style: "destructive", onPress: () => removeList(item.id) }
                  ]);
                }
              }}
              onEdit={() => setListModal({ visible: true, mode: 'edit', data: item })}
              onPress={() => navigation.navigate('Items', { listId: item.id, listName: item.name })}
              UNIT_MAP={UNIT_MAP}
            />
          )}
        />

        <TouchableOpacity style={styles.fab} onPress={() => setListModal({ visible: true, mode: 'create', data: null })}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        <ImportModal 
          visible={importVisible} 
          onClose={() => {
            setImportVisible(false);
            Clipboard.setStringAsync("");
          }}
          onImportSuccess={(list, items) => {
            importList(list, items);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setImportVisible(false);
            Clipboard.setStringAsync("");
            Alert.alert("Sucesso", "Lista importada!");
          }}
        />

        <ListModal 
          visible={listModal.visible}
          title={listModal.mode === 'edit' ? 'Editar Nome' : 'Novo Planejamento'}
          initialValue={listModal.data?.name}
          onClose={() => setListModal({ ...listModal, visible: false })}
          onSave={(name) => {
            if (listModal.mode === 'edit') updateListName(listModal.data.id, name);
            else addList(name);
            setListModal({ ...listModal, visible: false });
          }}
        />
        <Footer />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}