import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  KeyboardAvoidingView, Platform, Keyboard, Modal, 
  ActivityIndicator, Alert, TouchableWithoutFeedback,
  SafeAreaView, StatusBar
} from 'react-native';
import * as Location from 'expo-location';
import Purchases from 'react-native-purchases';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../services/supabase'; 
import { useCartStore } from '../../store/cartStore';
import ShoppingItem from '../../components/ShoppingItem';
import Footer from '../../components/Footer';
import styles from './styles';

export default function ShoppingList({ route, navigation }) {
  const { listId } = route?.params || {};
  const { 
    items, addItem, confirmItem, removeItem, reopenItem, 
    lists, finishList, updateListName, createList,
    syncOfflinePrices, processQueue, uploadQueue 
  } = useCartStore();
  const isFocused = useIsFocused();
  
  const [itemName, setItemName] = useState('');
  const [unitType, setUnitType] = useState('UNIT'); 
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingsData, setSavingsData] = useState({ total: 0, items: [] });
  const [newName, setNewName] = useState('');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [nearbyMarkets, setNearbyMarkets] = useState([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const [bestPrices, setBestPrices] = useState({});
  const [isPremium, setIsPremium] = useState(false);
  const [isFocusedMode, setIsFocusedMode] = useState(false);
  const [onlyEssentials, setOnlyEssentials] = useState(false);

  const currentList = lists.find(l => l.id === listId);
  const filteredItems = items.filter(i => i.listId === listId);

  const groupedItems = useMemo(() => {
    let listToGroup = [...filteredItems];
    if (onlyEssentials) listToGroup = listToGroup.filter(i => i.isEssential || !i.completed);
    const sorted = listToGroup.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.category || 'Outros').localeCompare(b.category || 'Outros');
    });
    const itemsWithHeaders = [];
    let lastCategory = null;
    sorted.forEach((item) => {
      if (!item.completed && item.category !== lastCategory) {
        itemsWithHeaders.push({ isHeader: true, title: item.category || 'Outros', id: `header-${item.category}` });
        lastCategory = item.category;
      } else if (item.completed && lastCategory !== 'Completados') {
        itemsWithHeaders.push({ isHeader: true, title: 'Completados', id: 'header-completed' });
        lastCategory = 'Completados';
      }
      itemsWithHeaders.push(item);
    });
    return itemsWithHeaders;
  }, [filteredItems, onlyEssentials]);

  useEffect(() => { 
    if (isFocused) {
      checkPremiumStatus();
      processQueue(); 
    } 
  }, [isFocused]);

  useEffect(() => { if (currentList?.lockedMarket) setSelectedMarket(currentList.lockedMarket); }, [currentList]);
  useEffect(() => { if (filteredItems.length > 0) fetchComparisons(); }, [filteredItems.length, items]);

  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) { console.log(e); }
  };

  const handleOfflineSync = async () => {
    if (filteredItems.length === 0) return;
    setIsSyncingOffline(true);
    const names = filteredItems.map(i => i.name.toLowerCase().trim());
    const result = await syncOfflinePrices(names);
    setIsSyncingOffline(false);
    if (result === "SUCCESS") {
      Alert.alert("Modo Offline", "Preços sincronizados. Você pode ver as médias mesmo sem internet dentro do mercado.");
      fetchComparisons(); 
    }
  };

  const fetchMarketsOSM = async () => {
    if (currentList?.lockedMarket) return;
    setIsLoadingMarkets(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=supermarket&lat=${latitude}&lon=${longitude}&bounded=1&viewbox=${longitude - 0.045},${latitude + 0.045},${longitude + 0.045},${latitude - 0.045}&limit=15`;
      const response = await fetch(url, { headers: { 'User-Agent': 'RiscaE_App' } });
      const data = await response.json();
      setNearbyMarkets(data.map(m => ({
        name: m.display_name.split(',')[0],
        place_id: String(m.place_id),
        address: m.display_name.split(',').slice(1, 3).join(',')
      })));
    } catch (error) { console.error(error); } finally { setIsLoadingMarkets(false); }
  };

  const fetchComparisons = async () => {
    const itemNames = filteredItems.map(i => i.name.toLowerCase().trim());
    if (itemNames.length === 0) return;
    const { data } = await supabase.from('historico_precos').select(`nome_item, preco, data_compra, mercados_id, mercados!fk_mercado_osm ( nome, endereco )`).in('nome_item', itemNames).order('preco', { ascending: true });
    if (data) {
      const cheapestMap = {};
      data.forEach(entry => {
        const key = entry.nome_item.toLowerCase().trim();
        if (!cheapestMap[key]) {
          cheapestMap[key] = { 
            preco: entry.preco, 
            mercadoNome: entry.mercados?.nome, 
            mercadoId: String(entry.mercados_id), 
            mercadoEndereco: entry.mercados?.endereco 
          };
        }
      });
      setBestPrices(cheapestMap);
    }
  };

  const handleSegmentItem = (item, bestDeal) => {
    const segmentListName = `Mover: ${bestDeal.mercadoNome}`;
    const marketToLock = { name: bestDeal.mercadoNome, place_id: String(bestDeal.mercadoId), address: bestDeal.mercadoEndereco };
    let targetList = lists.find(l => l.name === segmentListName && !l.finished && String(l.lockedMarket?.place_id) === String(marketToLock.place_id));
    let targetListId = targetList ? targetList.id : createList(segmentListName, marketToLock);
    addItem(targetListId, item.name, item.unitType, { brand: item.brand, category: item.category, amount: item.amount, price: bestDeal.preco });
    removeItem(item.id);
  };

  const handleFinalizeWithCheck = () => {
    if (!selectedMarket) { setShowMarketModal(true); fetchMarketsOSM(); return; }
    const itemsToSegment = filteredItems.filter(item => {
      const bestDeal = bestPrices[item.name.toLowerCase().trim()];
      if (!bestDeal || !item.completed) return false;
      const isDifferentMarket = String(bestDeal.mercadoId) !== String(selectedMarket.place_id);
      const isMoreExpensive = item.price > bestDeal.preco;
      return isDifferentMarket && isMoreExpensive;
    });
    if (itemsToSegment.length > 0) {
      const total = itemsToSegment.reduce((acc, item) => {
        const bestDeal = bestPrices[item.name.toLowerCase().trim()];
        return acc + ((item.price - bestDeal.preco) * item.amount);
      }, 0);
      setSavingsData({ total, items: itemsToSegment });
      setShowSavingsModal(true);
    } else {
      finishList(listId, selectedMarket);
      navigation.navigate('Dashboard');
    }
  };

  const confirmSegmentation = () => {
    savingsData.items.forEach(item => {
      const bestDeal = bestPrices[item.name.toLowerCase().trim()];
      handleSegmentItem(item, bestDeal);
    });
    setShowSavingsModal(false);
    finishList(listId, selectedMarket);
    navigation.navigate('Dashboard');
  };

  const calculateTotalSavings = () => {
    let total = 0;
    filteredItems.forEach(item => {
      const bestDeal = bestPrices[item.name.toLowerCase().trim()];
      if (bestDeal) {
        const userPrice = item.price || 0;
        if (userPrice > bestDeal.preco) total += (userPrice - bestDeal.preco) * item.amount;
        else if (userPrice === 0) total += 0.50 * item.amount;
      }
    });
    return total;
  };

  const IntelSavingsBanner = () => {
    const savings = calculateTotalSavings();
    if (isFocusedMode || savings <= 0) return null;
    return (
      <TouchableOpacity 
        onPress={() => isPremium ? navigation.navigate('PriceIntelligence', { listId }) : navigation.navigate('Paywall')}
        style={{ marginHorizontal: 20, marginBottom: 15, backgroundColor: '#F0FDF4', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#46C68E', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View>
          <Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold' }}>ECONOMIA POSSÍVEL</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#14532D' }}>R$ {savings.toFixed(2)}</Text>
        </View>
        <View style={{ backgroundColor: '#46C68E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>VER DETALHES ➔</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const PriceComparisonLabel = ({ item }) => {
    if (isFocusedMode) return null;
    const bestDeal = bestPrices[item.name.toLowerCase().trim()];
    if (!bestDeal) return <View style={{ marginBottom: 10 }} />;
    const isPayingMore = item.completed && item.price > bestDeal.preco;
    if (isPayingMore) return (
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <TouchableOpacity 
          onPress={() => Alert.alert("Mover Item?", `Deseja mover "${item.name}"?`, [{text: "Não"}, {text: "Sim", onPress: () => handleSegmentItem(item, bestDeal)}])} 
          style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}
        >
          <Text style={{ fontSize: 11, color: '#991B1B', fontWeight: '900' }}>⚠️ R$ {((item.price - bestDeal.preco) * item.amount).toFixed(2)} A MAIS!</Text>
          <Text style={{ fontSize: 10, color: '#B91C1C' }}>No {bestDeal.mercadoNome} é R$ {bestDeal.preco.toFixed(2)}. Toque para mover ➔</Text>
        </TouchableOpacity>
      </View>
    );
    return !item.completed ? (
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <View style={{ backgroundColor: '#F0FDF4', padding: 10, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#46C68E' }}>
          <Text style={{ fontSize: 11, color: '#166534', fontWeight: '600' }}>✨ Melhor preço: R$ {bestDeal.preco.toFixed(2)} em {bestDeal.mercadoNome}</Text>
        </View>
      </View>
    ) : <View style={{ marginBottom: 10 }} />;
  };

  const handleUpdateName = () => { if (newName.trim()) { updateListName(listId, newName); setShowEditModal(false); setNewName(''); } };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View style={[styles.container, { flex: 1 }]}>
        
        {uploadQueue.length > 0 && (
          <View style={{ backgroundColor: '#F59E0B', paddingVertical: 4, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>⏳ SINCRONIZANDO {uploadQueue.length} PREÇOS...</Text>
          </View>
        )}

        <View style={[styles.header, { paddingTop: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 5 }}>
                <Text style={styles.backText}>← Voltar</Text>
              </TouchableOpacity>
              
              {!isFocusedMode && (
                <TouchableOpacity 
                  onPress={handleOfflineSync}
                  disabled={isSyncingOffline}
                  style={{ backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                >
                  {isSyncingOffline ? <ActivityIndicator size="small" color="#1A1C2E" /> : <Text style={{ fontSize: 14 }}>📵</Text>}
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
              <TouchableOpacity onPress={() => setIsFocusedMode(!isFocusedMode)} style={{ backgroundColor: isFocusedMode ? '#1A1C2E' : '#F1F5F9', paddingHorizontal: 8, height: 32, borderRadius: 8, justifyContent: 'center' }}><Text style={{ color: isFocusedMode ? '#FFF' : '#1A1C2E', fontSize: 8, fontWeight: '900' }}>{isFocusedMode ? '⚡ RÁPIDO' : '📱 NORMAL'}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setOnlyEssentials(!onlyEssentials)} style={{ backgroundColor: onlyEssentials ? '#EF4444' : '#F1F5F9', paddingHorizontal: 8, height: 32, borderRadius: 8, justifyContent: 'center' }}><Text style={{ color: onlyEssentials ? '#FFF' : '#1A1C2E', fontSize: 8, fontWeight: '900' }}>{onlyEssentials ? '⭐ CRÍTICOS' : '📑 TUDO'}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowMarketModal(true); fetchMarketsOSM(); }} style={{ backgroundColor: selectedMarket ? '#F0FDF4' : '#1A1C2E', paddingHorizontal: 8, height: 32, borderRadius: 8, borderWidth: 1, borderColor: selectedMarket ? '#46C68E' : 'transparent', maxWidth: 100, flexShrink: 1, justifyContent: 'center' }}><Text style={{ color: selectedMarket ? '#46C68E' : '#FFF', fontSize: 8, fontWeight: '900' }} numberOfLines={1}>{selectedMarket ? `📍 ${selectedMarket.name.toUpperCase()}` : '📍 ONDE?'}</Text></TouchableOpacity>
            </View>
          </View>

          {!isFocusedMode && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>LISTA ATUAL</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1C2E', flexShrink: 1 }} numberOfLines={1}>{currentList?.name}</Text>
                  <TouchableOpacity onPress={() => { setNewName(currentList?.name); setShowEditModal(true); }} style={{ marginLeft: 8 }}><Text style={{ fontSize: 10, color: '#46C68E', fontWeight: '900' }}>EDITAR</Text></TouchableOpacity>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1C2E' }}>R$ {currentList?.total?.toFixed(2) || "0.00"}</Text>
              </View>
            </View>
          )}
        </View>

        <IntelSavingsBanner />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <FlatList data={groupedItems} keyExtractor={item => item.id}
            ListHeaderComponent={!isFocusedMode && (
              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 6, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setUnitType(prev => prev === 'UNIT' ? 'KG' : 'UNIT')} style={{ backgroundColor: '#1A1C2E', paddingHorizontal: 12, height: 44, borderRadius: 12, justifyContent: 'center', marginRight: 5 }}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>{unitType === 'UNIT' ? 'UN' : 'KG'}</Text></TouchableOpacity>
                  <TextInput style={{ flex: 1, height: 50, paddingHorizontal: 10, fontSize: 16, fontWeight: '600' }} placeholder="O que vamos comprar?" value={itemName} onChangeText={setItemName} />
                  <TouchableOpacity onPress={() => { if(itemName.trim()) addItem(listId, itemName, unitType); setItemName(''); }} style={{ backgroundColor: '#1A1C2E', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontSize: 24 }}>+</Text></TouchableOpacity>
                </View>
              </View>
            )}
            renderItem={({ item }) => item.isHeader ? 
              <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 }}><Text style={{ fontSize: 11, fontWeight: '900', color: '#94A3B8' }}>{item.title.toUpperCase()}</Text></View> :
              <View>
                <ShoppingItem item={item} onConfirm={confirmItem} onRemove={removeItem} onReopen={reopenItem} suggestedPrice={bestPrices[item.name.toLowerCase().trim()]?.preco} isFocusedMode={isFocusedMode} />
                <PriceComparisonLabel item={item} />
              </View>
            }
          />
        </KeyboardAvoidingView>

        <View style={{ padding: 20, backgroundColor: '#FFF' }}>
          <TouchableOpacity onPress={handleFinalizeWithCheck} style={{ backgroundColor: '#46C68E', padding: 18, borderRadius: 20, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: '900' }}>
              {selectedMarket ? `FINALIZAR POR R$ ${currentList?.total?.toFixed(2) || "0.00"}` : 'SELECIONE O MERCADO'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showSavingsModal} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(26, 28, 46, 0.95)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#F0FDF4', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 40 }}>💡</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A1C2E', textAlign: 'center' }}>Oportunidade de Economia!</Text>
              <View style={{ marginVertical: 25, alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, width: '100%' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B' }}>VOCÊ PODE ECONOMIZAR ATÉ</Text>
                <Text style={{ fontSize: 36, fontWeight: '900', color: '#46C68E' }}>R$ {savingsData.total.toFixed(2)}</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 5, textAlign: 'center' }}>Separando {savingsData.items.length} itens para mercados mais baratos.</Text>
              </View>
              <TouchableOpacity onPress={confirmSegmentation} style={{ backgroundColor: '#46C68E', width: '100%', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>SIM, SEPARAR E ECONOMIZAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowSavingsModal(false); finishList(listId, selectedMarket); navigation.navigate('Dashboard'); }} style={{ width: '100%', padding: 18, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' }}>
                <Text style={{ color: '#1A1C2E', fontWeight: '700' }}>NÃO, FINALIZAR TUDO AQUI</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowSavingsModal(false)} style={{ marginTop: 20 }}><Text style={{ color: '#94A3B8', fontWeight: '700', fontSize: 12 }}>VOLTAR PARA A LISTA</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showMarketModal} animationType="fade" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(26, 28, 46, 0.8)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 30, padding: 25, maxHeight: '80%' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', marginBottom: 20, color: '#1A1C2E' }}>📍 Mercados Próximos</Text>
              {isLoadingMarkets ? <ActivityIndicator color="#46C68E" size="large" /> : (
                <FlatList data={nearbyMarkets} keyExtractor={m => m.place_id} renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => { setSelectedMarket(item); setShowMarketModal(false); }} style={{ padding: 18, backgroundColor: '#F8FAFC', borderRadius: 15, marginBottom: 10 }}>
                    <Text style={{ fontWeight: '800', color: '#1A1C2E' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>{item.address}</Text>
                  </TouchableOpacity>
                )} />
              )}
              <TouchableOpacity onPress={() => setShowMarketModal(false)} style={{ marginTop: 20, alignItems: 'center' }}><Text style={{ color: '#94A3B8', fontWeight: '700' }}>CANCELAR</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showEditModal} animationType="fade" transparent>
          <TouchableWithoutFeedback onPress={() => setShowEditModal(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(26, 28, 46, 0.8)', justifyContent: 'center', padding: 20 }}>
              <TouchableWithoutFeedback>
                <View style={{ backgroundColor: '#FFF', borderRadius: 30, padding: 25 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 20, color: '#1A1C2E', textAlign: 'center' }}>Editar Nome da Lista</Text>
                  <TextInput style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 18, fontSize: 16, color: '#1A1C2E', borderWidth: 1, borderColor: '#F1F5F9' }} value={newName} onChangeText={setNewName} autoFocus />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={() => setShowEditModal(false)}><Text style={{ color: '#64748B', fontWeight: '700' }}>CANCELAR</Text></TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1.5, backgroundColor: '#1A1C2E', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={handleUpdateName}><Text style={{ color: '#FFF', fontWeight: '800' }}>SALVAR</Text></TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        <Footer />
      </View>
    </SafeAreaView>
  );
}