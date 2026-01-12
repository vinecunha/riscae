import React, { useState, useMemo, useEffect } from 'react';
import { FlatList, SafeAreaView, StatusBar, TouchableOpacity, Text, Alert, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useIsFocused } from '@react-navigation/native';
import { useCartStore } from '../../store/cartStore';

import DashboardHeader from '../../components/DashboardHeader';
import DashboardListCard from '../../components/DashboardListCard';
import ImportModal from '../../components/ImportModal';
import ListModal from '../../components/ListModal';
import Footer from '../../components/Footer';
import { UNIT_MAP } from '../../services/importService';
import styles from './styles';

export default function Dashboard({ navigation }) {
  const { lists, items, addList, importList, removeList, updateListName } = useCartStore();
  const isFocused = useIsFocused();
  
  const [isPremium, setIsPremium] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [listModal, setListModal] = useState({ visible: false, mode: 'create', data: null });

  const checkClipboardForLink = async () => {
    const content = await Clipboard.getStringAsync();
    if (content.includes('riscae.app/import?data=')) {
      setTimeout(() => {
        setImportVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 500);
      
    }
  };

  useEffect(() => {
    if (isFocused) {
      checkClipboardForLink();
    }
  }, [isFocused]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isFocused) {
        checkClipboardForLink();
      }
    });

    return () => subscription.remove();
  }, [isFocused]);

  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) { console.log(e); }
  };

  useEffect(() => { if (isFocused) checkPremiumStatus(); }, [isFocused]);

  const sortedLists = useMemo(() => {
    return [...lists].sort((a, b) => {
      const aItems = items.filter(i => i.listId === a.id);
      const bItems = items.filter(i => i.listId === b.id);
      const aDone = aItems.length > 0 && aItems.every(i => i.completed);
      const bDone = bItems.length > 0 && bItems.every(i => i.completed);
      return aDone === bDone ? 0 : aDone ? 1 : -1;
    });
  }, [lists, items]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <DashboardHeader isPremium={isPremium} navigation={navigation} onImport={() => setImportVisible(true)} />

        <FlatList 
          data={sortedLists}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <DashboardListCard 
              item={item} items={items}
              onDelete={() => removeList(item.id)}
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
            Clipboard.setStringAsync(""); // Limpa após sucesso
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