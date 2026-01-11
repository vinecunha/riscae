import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback,
  Share,
  Alert,
  Image
} from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Purchases from 'react-native-purchases';
import { useIsFocused } from '@react-navigation/native';
import { useCartStore } from '../../store/cartStore';
import Footer from '../../components/Footer';
import styles from './styles';

export default function Dashboard({ navigation }) {
  const { lists, items, addList, importList, removeList, updateListName } = useCartStore();
  const isFocused = useIsFocused();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  
  const [listName, setListName] = useState('');
  const [editingList, setEditingList] = useState(null);
  const [importCode, setImportCode] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) {
      console.log("Erro ao verificar premium:", e);
    }
  };

  useEffect(() => {
    if (isFocused) {
      checkPremiumStatus();
    }
  }, [isFocused]);

  const sortedLists = useMemo(() => {
    return [...lists].sort((a, b) => {
      const aItems = items.filter(i => i.listId === a.id);
      const bItems = items.filter(i => i.listId === b.id);
      const aDone = aItems.length > 0 && aItems.every(i => i.completed);
      const bDone = bItems.length > 0 && bItems.every(i => i.completed);
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return 0;
    });
  }, [lists, items]);

  const handleCreateList = () => {
    if (listName.trim()) {
      addList(listName);
      setListName('');
      setModalVisible(false);
    }
  };

  const handleUpdateName = () => {
    if (listName.trim() && editingList) {
      updateListName(editingList.id, listName);
      setListName('');
      setEditingList(null);
      setEditModalVisible(false);
    }
  };

  const openEditModal = (list) => {
    setEditingList(list);
    setListName(list.name);
    setEditModalVisible(true);
  };

  const handleExport = async (list) => {
    const listItems = items.filter(i => i.listId === list.id);
    const exportData = {
      v: "1.0",
      l: { n: list.name, t: list.total },
      i: listItems.map(i => ({ n: i.name, u: i.unitType, a: i.amount, p: i.price }))
    };
    try {
      const code = btoa(JSON.stringify(exportData));
      const message = `RISCAÊ CODE:\n${code}\n\nCopie o código acima e cole no botão IMPORTAR do seu app RISCAÊ.`;
      await Share.share({ title: `Exportar ${list.name}`, message });
    } catch (error) {
      Alert.alert("Erro ao gerar código");
    }
  };

  const handleImport = () => {
    try {
      const cleanCode = importCode.includes('RISCAÊ CODE:') ? importCode.split('\n')[1].trim() : importCode.trim();
      const decodedData = JSON.parse(atob(cleanCode));
      if (decodedData.l && decodedData.i) {
        importList({ name: decodedData.l.n, total: decodedData.l.t }, decodedData.i.map(item => ({
          name: item.n, unitType: item.u, amount: item.a, price: item.p, completed: false
        })));
        setImportCode('');
        setImportModalVisible(false);
        Alert.alert("Sucesso", "Lista importada!");
      }
    } catch (e) {
      Alert.alert("Erro", "Código inválido.");
    }
  };

  const renderRightActions = (listId) => (
    <TouchableOpacity 
      onPress={() => {
        Alert.alert("Excluir Lista", "Deseja realmente apagar esta lista e todos os seus itens?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Apagar", onPress: () => removeList(listId), style: "destructive" }
        ]);
      }}
      style={{ backgroundColor: '#FF7675', justifyContent: 'center', alignItems: 'center', width: 80, marginBottom: 15, borderRadius: 20, marginLeft: 10 }}
    >
      <Text style={{ fontSize: 22 }}>🗑️</Text>
      <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900', marginTop: 5 }}>APAGAR</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { flex: 1, justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Image source={require('../../assets/logo.png')} style={{ width: 85, height: 35, marginBottom: 2 }} resizeMode="contain" />
                
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Premium')}
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: isPremium ? 'rgba(255, 215, 0, 0.2)' : '#F1F5F9',
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 6,
                    alignSelf: 'flex-start',
                    marginTop: 2,
                    borderWidth: isPremium ? 0.5 : 0,
                    borderColor: '#dd0'
                  }}
                >
                  <Text style={{ fontSize: 9, marginRight: 3 }}>{isPremium ? '👑' : '⚪'}</Text>
                  <Text style={{ 
                    fontSize: 8, 
                    fontWeight: '900', 
                    color: isPremium ? '#505700' : '#64748B' 
                  }}>
                    {isPremium ? 'ASSINATURA PRO' : 'VERSÃO GRATUITA'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ 
                flexDirection: 'row', 
                backgroundColor: '#FFF', 
                padding: 4, 
                borderRadius: 14,
                gap: 4,
                alignItems: 'center',
                elevation: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2
              }}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('ScanReceipt')} 
                  style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 18 }}>📷</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Backup')} 
                  style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isPremium ? '#E8F7F0' : 'transparent' }}
                >
                  <Text style={{ fontSize: 18 }}>☁️</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('History')} 
                  style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 18 }}>🕒</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setImportModalVisible(true)} 
                  style={{ backgroundColor: '#1A1C2E', width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 16 }}>📥</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <FlatList 
            data={sortedLists}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 5, paddingBottom: 150, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const listItems = items.filter(i => i.listId === item.id);
              const isComplete = listItems.length > 0 && listItems.every(i => i.completed);

              return (
                <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false} onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                  <TouchableOpacity 
                    style={[styles.listCard, { flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 15 }, isComplete && { borderColor: '#46C68E', borderWidth: 1 }]}
                    activeOpacity={0.7}
                    onLongPress={() => openEditModal(item)}
                    onPress={() => {
                      if (isComplete) {
                        Alert.alert("Lista Concluída! 🎉", "O que deseja fazer?", [
                          { text: "Ver Itens", onPress: () => navigation.navigate('Items', { listId: item.id, listName: item.name }) },
                          { text: "Finalizar Agora", onPress: () => navigation.navigate('Items', { listId: item.id, autoFinish: true }) }
                        ]);
                      } else {
                        navigation.navigate('Items', { listId: item.id, listName: item.name });
                      }
                    }}
                  >
                    <View style={{ width: 45, height: 45, backgroundColor: isComplete ? '#E8F7F0' : '#F1F5F9', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                      <Text style={{ fontSize: 20 }}>{isComplete ? '✅' : '📋'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listName, { marginBottom: 2 }, isComplete && { color: '#46C68E' }]}>{item.name}</Text>
                      <Text style={[styles.label, { fontSize: 12 }]}>{isComplete ? "PRONTA PARA FINALIZAR" : `Total: R$ ${item.total?.toFixed(2) || "0.00"}`}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleExport(item)} style={{ alignItems: 'center', paddingLeft: 10 }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', color: '#94A3B8', marginBottom: 4 }}>EXPORTAR</Text>
                      <Text style={{ fontSize: 18 }}>📤</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Swipeable>
              );
            }}
          />
        </View>

        <TouchableOpacity style={[styles.fab, { backgroundColor: '#46C68E', bottom: 120 }]} onPress={() => { setListName(''); setModalVisible(true); }}>
          <Text style={{ color: '#FFF', fontSize: 35, fontWeight: '300' }}>+</Text>
        </TouchableOpacity>
        <Footer />

        <Modal visible={modalVisible} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26, 28, 46, 0.8)' }}>
              <TouchableWithoutFeedback>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <View style={{ backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingBottom: 40 }}>
                    <View style={{ width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 }} />
                    <Text style={[styles.listName, { fontSize: 20, textAlign: 'center' }]}>Novo Planejamento</Text>
                    <TextInput style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 18, marginTop: 20, fontSize: 16, color: '#1A1C2E', borderWidth: 1, borderColor: '#F1F5F9' }} placeholder="Ex: Rancho do Mês" autoFocus value={listName} onChangeText={setListName} />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                      <TouchableOpacity style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={() => setModalVisible(false)}>
                        <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 13 }}>CANCELAR</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 1.5, backgroundColor: '#46C68E', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={handleCreateList}>
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>CRIAR LISTA</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal visible={editModalVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(26, 28, 46, 0.8)', padding: 20 }}>
              <TouchableWithoutFeedback>
                <View style={{ backgroundColor: '#FFF', padding: 25, borderRadius: 30 }}>
                  <Text style={[styles.listName, { fontSize: 18, textAlign: 'center' }]}>Editar Nome da Lista</Text>
                  <TextInput style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 18, marginTop: 20, fontSize: 16, color: '#1A1C2E', borderWidth: 1, borderColor: '#F1F5F9' }} value={listName} onChangeText={setListName} autoFocus />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={() => setEditModalVisible(false)}>
                      <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 13 }}>CANCELAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1.5, backgroundColor: '#1A1C2E', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={handleUpdateName}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>SALVAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal visible={importModalVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setImportModalVisible(false)}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26, 28, 46, 0.8)' }}>
              <TouchableWithoutFeedback>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <View style={{ backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingBottom: 40 }}>
                    <Text style={[styles.listName, { fontSize: 20, textAlign: 'center' }]}>Importar Lista</Text>
                    <TextInput style={{ backgroundColor: '#F8FAFC', padding: 15, borderRadius: 18, marginTop: 20, fontSize: 11, borderWidth: 1, borderColor: '#F1F5F9', height: 120, textAlignVertical: 'top', color: '#64748B' }} placeholder="Cole o código aqui..." multiline value={importCode} onChangeText={setImportCode} />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                      <TouchableOpacity style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={() => setImportModalVisible(false)}>
                        <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 13 }}>CANCELAR</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 1.5, backgroundColor: '#1A1C2E', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={handleImport}>
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>IMPORTAR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}