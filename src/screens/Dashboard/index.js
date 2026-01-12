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
  Image,
  SafeAreaView,
  StatusBar
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.container, { flex: 1, justifyContent: 'space-between', paddingTop: Platform.OS === 'android' ? 10 : 0 }]}>
          
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 5, paddingTop: 15, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Image source={require('../../assets/logo.png')} style={{ width: 90, height: 35 }} resizeMode="contain" />
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Premium')}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      backgroundColor: isPremium ? '#FFF9E6' : '#F1F5F9',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      marginTop: 8,
                      alignSelf: 'flex-start',
                      borderWidth: isPremium ? 1 : 0,
                      borderColor: '#FFD700'
                    }}
                  >
                    <Text style={{ fontSize: 10, marginRight: 4 }}>{isPremium ? '👑' : '⚪'}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: isPremium ? '#B8860B' : '#64748B' }}>
                      {isPremium ? 'RISCAÊ PRO' : 'PLANO FREE'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ 
                  flexDirection: 'row', 
                  backgroundColor: '#FFF', 
                  borderRadius: 20, 
                  padding: 6,
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  gap: 2
                }}>
                  <TouchableOpacity onPress={() => navigation.navigate('ScanReceipt')} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>📷</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('History')} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>🕒</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>👤</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setImportModalVisible(true)} 
                    style={{ backgroundColor: '#1A1C2E', width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}
                  >
                    <Text style={{ fontSize: 16 }}>📥</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <FlatList 
              data={sortedLists}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150, paddingTop: 15 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const listItems = items.filter(i => i.listId === item.id);
                const isComplete = listItems.length > 0 && listItems.every(i => i.completed);

                return (
                  <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false} onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                    <TouchableOpacity 
                      style={[styles.listCard, { flexDirection: 'row', alignItems: 'center', padding: 18, marginBottom: 12, borderRadius: 24, backgroundColor: '#FFF' }, isComplete && { borderColor: '#46C68E', borderWidth: 1.5 }]}
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
                      <View style={{ width: 48, height: 48, backgroundColor: isComplete ? '#E8F7F0' : '#F1F5F9', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                        <Text style={{ fontSize: 22 }}>{isComplete ? '✅' : '📋'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listName, { fontSize: 16, fontWeight: '800' }, isComplete && { color: '#46C68E' }]}>{item.name}</Text>
                        <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 }}>
                          {isComplete ? "PRONTA PARA FINALIZAR" : `Total: R$ ${item.total?.toFixed(2) || "0.00"}`}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleExport(item)} style={{ padding: 10 }}>
                        <Text style={{ fontSize: 20 }}>📤</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </Swipeable>
                );
              }}
            />
          </View>

          <TouchableOpacity style={[styles.fab, { backgroundColor: '#46C68E', bottom: 120, width: 65, height: 65, borderRadius: 22, elevation: 8, shadowOpacity: 0.3 }]} onPress={() => { setListName(''); setModalVisible(true); }}>
            <Text style={{ color: '#FFF', fontSize: 40, fontWeight: '200' }}>+</Text>
          </TouchableOpacity>
          
          <Footer />

          {/* MODALS MANTIDOS CONFORME SOLICITADO */}
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
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}