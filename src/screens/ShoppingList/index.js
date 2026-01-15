import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  KeyboardAvoidingView, Platform, Keyboard, Modal, 
  ActivityIndicator, Alert, TouchableWithoutFeedback,
  StatusBar
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
    lists, finishList, updateListName, addList, removeList,
    syncOfflinePrices, processQueue, restoreBackup, uploadQueue 
  } = useCartStore();
  const isFocused = useIsFocused();
  
  const isCheckingPremium = useRef(false);
  
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
  const [lastSync, setLastSync] = useState(null);
  const [sortType, setSortType] = useState('distance'); 
  
  const [suggestions, setSuggestions] = useState([]);

  const currentList = lists.find(l => l.id === listId);
  const filteredItems = items.filter(i => i.listId === listId);

  const groupedItems = useMemo(() => {
    let listToGroup = [...filteredItems];
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
  }, [filteredItems]);

  const syncData = async () => {
    try {
      await processQueue();
      await restoreBackup(true);
      const now = new Date();
      setLastSync(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    } catch (e) { console.log("Sync error:", e); }
  };

  useEffect(() => {
    const fetchCombinedSuggestions = async () => {
      if (itemName.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      const query = itemName.toLowerCase().trim();
      try {
        const dictPromise = supabase.from('dicionario_produtos').select('termo_principal, categoria, unidade_sugerida').or(`termo_principal.ilike.%${query}%,sinonimos.cs.{"${query}"}`).limit(5);
        const histPromise = supabase.from('historico_precos').select('nome_item, categoria, unidade').ilike('nome_item', `%${query}%`).limit(5);
        const [dictRes, histRes] = await Promise.all([dictPromise, histPromise]);
        const dictItems = (dictRes.data || []).map(item => ({ name: item.termo_principal, category: item.categoria, unit: item.unidade_sugerida, source: 'dict' }));
        const histItems = (histRes.data || []).map(item => ({ name: item.nome_item, category: item.categoria, unit: item.unidade, source: 'hist' }));
        const combined = [...dictItems];
        histItems.forEach(hItem => { if (!combined.find(c => c.name.toLowerCase() === hItem.name.toLowerCase())) combined.push(hItem); });
        setSuggestions(combined.slice(0, 6));
      } catch (error) { console.error("Search error:", error); }
    };
    const timeoutId = setTimeout(fetchCombinedSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [itemName]);

  useEffect(() => { 
    if (isFocused) {
      checkPremiumStatus();
      syncData();
    } 
  }, [isFocused]);

  useEffect(() => { if (currentList?.lockedMarket) setSelectedMarket(currentList.lockedMarket); }, [currentList]);
  useEffect(() => { if (filteredItems.length > 0) fetchComparisons(); }, [filteredItems.length, items]);

  const checkPremiumStatus = async () => {
    if (isCheckingPremium.current) return;
    isCheckingPremium.current = true;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) { 
        console.log("RevenueCat error suppressed"); 
    } finally {
      isCheckingPremium.current = false;
    }
  };

  const handleOfflineSync = async () => {
    if (filteredItems.length === 0) return;
    setIsSyncingOffline(true);
    const names = filteredItems.map(i => i.name.toLowerCase().trim());
    const result = await syncOfflinePrices(names);
    setIsSyncingOffline(false);
    if (result === "SUCCESS") {
      Alert.alert("Modo Offline", "Preços sincronizados!");
      fetchComparisons(); 
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchMarketsOSM = async () => {
    if (currentList?.lockedMarket) return;
    setIsLoadingMarkets(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=supermarket&lat=${latitude}&lon=${longitude}&bounded=1&viewbox=${longitude - 0.045},${latitude + 0.045},${longitude + 0.045},${latitude - 0.045}&limit=100`;
      const response = await fetch(url, { headers: { 'User-Agent': 'RiscaE_App' } });
      const data = await response.json();
      const mapped = data.map(m => ({
        name: m.display_name.split(',')[0],
        place_id: String(m.place_id),
        address: m.display_name.split(',').slice(1, 3).join(','),
        distance: calculateDistance(latitude, longitude, parseFloat(m.lat), parseFloat(m.lon))
      }));
      sortMarkets(mapped, sortType);
    } catch (error) { console.error(error); } finally { setIsLoadingMarkets(false); }
  };

  const sortMarkets = (list, type) => {
    const sorted = [...list].sort((a, b) => {
      if (type === 'distance') return a.distance - b.distance;
      return a.name.localeCompare(b.name);
    });
    setNearbyMarkets(sorted);
    setSortType(type);
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
          cheapestMap[key] = { preco: Number(entry.preco), mercadoNome: entry.mercados?.nome, mercadoId: String(entry.mercados_id), mercadoEndereco: entry.mercados?.endereco };
        }
      });
      setBestPrices(cheapestMap);
    }
  };

  const handleSegmentItem = (item, bestDeal) => {
    const segmentListName = `🆕 Riscaê PRO @ ${bestDeal.mercadoNome}`;
    const marketToLock = { name: bestDeal.mercadoNome, place_id: String(bestDeal.mercadoId), address: bestDeal.mercadoEndereco };
    let targetList = lists.find(l => l.name === segmentListName && !l.finished && String(l.lockedMarket?.place_id) === String(marketToLock.place_id));
    let targetListId = targetList ? targetList.id : addList(segmentListName, marketToLock);
    addItem(targetListId, item.name, item.unitType, { brand: item.brand, category: item.category, amount: item.amount, price: bestDeal.preco });
    removeItem(item.id);
  };

  const handleFinalizeWithCheck = () => {
    if (!selectedMarket) { setShowMarketModal(true); fetchMarketsOSM(); return; }
    const itemsWithSavings = filteredItems.filter(item => {
      const bestDeal = bestPrices[item.name.toLowerCase().trim()];
      if (!bestDeal || !item.completed) return false;
      return String(bestDeal.mercadoId) !== String(selectedMarket.place_id) && Number(item.price) > Number(bestDeal.preco);
    });
    if (itemsWithSavings.length > 0) {
      const totalSaving = itemsWithSavings.reduce((acc, item) => {
        const bestDeal = bestPrices[item.name.toLowerCase().trim()];
        return acc + ((Number(item.price) - Number(bestDeal.preco)) * (Number(item.amount) || 1));
      }, 0);
      if (totalSaving >= 0.01) { setSavingsData({ total: totalSaving, items: itemsWithSavings }); setShowSavingsModal(true); return; }
    }
    finishList(listId, selectedMarket);
    navigation.navigate('Dashboard');
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
        const userPrice = Number(item.price) || 0;
        if (userPrice > bestDeal.preco) total += (userPrice - bestDeal.preco) * (Number(item.amount) || 1);
        else if (userPrice === 0) total += 0.50 * (Number(item.amount) || 1);
      }
    });
    return total;
  };

  const IntelSavingsBanner = () => {
    const savings = calculateTotalSavings();
    if (isFocusedMode || savings <= 0) return null;
    return (
      <TouchableOpacity onPress={() => isPremium ? navigation.navigate('PriceIntelligence', { listId }) : navigation.navigate('Paywall')} style={{ marginHorizontal: 20, marginBottom: 15, backgroundColor: '#F0FDF4', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#46C68E', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View><Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold' }}>ECONOMIA POSSÍVEL</Text><Text style={{ fontSize: 18, fontWeight: '900', color: '#14532D' }}>R$ {savings.toFixed(2)}</Text></View>
        <View style={{ backgroundColor: '#46C68E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>VER DETALHES ➔</Text></View>
      </TouchableOpacity>
    );
  };

  const PriceComparisonLabel = ({ item }) => {
    if (isFocusedMode) return null;
    const bestDeal = bestPrices[item.name.toLowerCase().trim()];
    if (!bestDeal) return <View style={{ marginBottom: 10 }} />;
    const isPayingMore = item.completed && Number(item.price) > Number(bestDeal.preco);
    if (isPayingMore) return (
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <TouchableOpacity onPress={() => Alert.alert("Mover Item?", `Deseja mover "${item.name}"?`, [{text: "Não"}, {text: "Sim", onPress: () => handleSegmentItem(item, bestDeal)}])} style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
          <Text style={{ fontSize: 11, color: '#991B1B', fontWeight: '900' }}>⚠️ R$ {((Number(item.price) - Number(bestDeal.preco)) * (Number(item.amount) || 1)).toFixed(2)} A MAIS!</Text>
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

  const handleDeleteList = () => {
    Alert.alert("Excluir Lista?", "Esta lista está vazia. Deseja removê-la?", [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: () => { removeList(listId); navigation.goBack(); } }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF', paddingTop: Platform.OS === 'ios' ? 5 : StatusBar.currentHeight + 10 }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <View style={[styles.container, { flex: 1 }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 5 }}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
              {!isFocusedMode && (
                <TouchableOpacity onPress={handleOfflineSync} disabled={isSyncingOffline} style={{ backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  {isSyncingOffline ? <ActivityIndicator size="small" color="#1A1C2E" /> : <Text style={{ fontSize: 14 }}>📵</Text>}
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
              <TouchableOpacity onPress={() => setIsFocusedMode(!isFocusedMode)} style={{ backgroundColor: isFocusedMode ? '#1A1C2E' : '#F1F5F9', paddingHorizontal: 8, height: 32, borderRadius: 8, justifyContent: 'center' }}><Text style={{ color: isFocusedMode ? '#FFF' : '#1A1C2E', fontSize: 8, fontWeight: '900' }}>{isFocusedMode ? '⚡ RÁPIDO' : '📱 NORMAL'}</Text></TouchableOpacity>
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
              <View style={{ alignItems: 'flex-end', minWidth: 80 }}><Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1C2E' }}>R$ {currentList?.total?.toFixed(2) || "0.00"}</Text></View>
            </View>
          )}
        </View>

        <IntelSavingsBanner />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <FlatList 
            data={groupedItems} 
            keyExtractor={item => item.id}
            ListEmptyComponent={(
              <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 20 }}>🛒</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1C2E', textAlign: 'center' }}>Sua lista está vazia!</Text>
                <TouchableOpacity onPress={handleDeleteList} style={{ marginTop: 25, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#FEF2F2', borderRadius: 12 }}><Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 11 }}>EXCLUIR ESTA LISTA</Text></TouchableOpacity>
              </View>
            )}
            ListHeaderComponent={(
              <View>
                {uploadQueue.length > 0 && <View style={{ backgroundColor: '#F59E0B', paddingVertical: 4, alignItems: 'center' }}><Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>⏳ SINCRONIZANDO {uploadQueue.length} PREÇOS...</Text></View>}
                {!isFocusedMode && (
                  <View style={{ padding: 20 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 6, alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => setUnitType(prev => prev === 'UNIT' ? 'KG' : 'UNIT')} style={{ backgroundColor: '#1A1C2E', paddingHorizontal: 12, height: 44, borderRadius: 12, justifyContent: 'center', marginRight: 5 }}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>{unitType === 'UNIT' ? 'UN' : 'KG'}</Text></TouchableOpacity>
                      <TextInput style={{ flex: 1, height: 50, paddingHorizontal: 10, fontSize: 16, fontWeight: '600' }} placeholder="O que vamos comprar?" value={itemName} onChangeText={setItemName} />
                      <TouchableOpacity onPress={() => { if(itemName.trim()) addItem(listId, itemName, unitType); setItemName(''); }} style={{ backgroundColor: '#1A1C2E', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontSize: 24 }}>+</Text></TouchableOpacity>
                    </View>
                    {suggestions.length > 0 && (
                      <View style={{ backgroundColor: '#FFF', borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                        {suggestions.map((sug, index) => (
                          <TouchableOpacity key={index} style={{ padding: 15, borderBottomWidth: index === suggestions.length - 1 ? 0 : 1, borderBottomColor: '#F1F5F9' }} onPress={() => { addItem(listId, sug.name, sug.unit === 'KG' ? 'KG' : 'UNIT', { category: sug.category }); setItemName(''); setSuggestions([]); Keyboard.dismiss(); }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View><Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1C2E' }}>{sug.name}</Text><Text style={{ fontSize: 8, color: '#94A3B8', fontWeight: 'bold' }}>{sug.source === 'dict' ? '📚 SUGERIDO' : '🕒 JÁ COMPRADO'}</Text></View>
                                <Text style={{ fontSize: 10, color: '#94A3B8' }}>{sug.category}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
            renderItem={({ item }) => item.isHeader ? 
              <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 }}><Text style={{ fontSize: 11, fontWeight: '900', color: '#94A3B8' }}>{item.title.toUpperCase()}</Text></View> :
              <View><ShoppingItem item={item} onConfirm={confirmItem} onRemove={removeItem} onReopen={reopenItem} suggestedPrice={bestPrices[item.name.toLowerCase().trim()]?.preco} isFocusedMode={isFocusedMode} /><PriceComparisonLabel item={item} /></View>
            }
          />
        </KeyboardAvoidingView>

        <View style={{ padding: 20, backgroundColor: '#FFF' }}>
          <TouchableOpacity onPress={handleFinalizeWithCheck} style={{ backgroundColor: '#46C68E', padding: 18, borderRadius: 20, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: '900' }}>{selectedMarket ? `FINALIZAR POR R$ ${currentList?.total?.toFixed(2) || "0.00"}` : 'SELECIONE O MERCADO'}</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showSavingsModal} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(26, 28, 46, 0.95)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#F0FDF4', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Text style={{ fontSize: 40 }}>💡</Text></View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A1C2E', textAlign: 'center' }}>Oportunidade de Economia!</Text>
              <View style={{ marginVertical: 25, alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, width: '100%' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B' }}>VOCÊ PODE ECONOMIZAR ATÉ</Text>
                <Text style={{ fontSize: 36, fontWeight: '900', color: '#46C68E' }}>R$ {savingsData.total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={confirmSegmentation} style={{ backgroundColor: '#46C68E', width: '100%', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 12 }}><Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>SIM, SEPARAR E ECONOMIZAR</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowSavingsModal(false); finishList(listId, selectedMarket); navigation.navigate('Dashboard'); }} style={{ width: '100%', padding: 18, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' }}><Text style={{ color: '#1A1C2E', fontWeight: '700' }}>NÃO, FINALIZAR TUDO AQUI</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showMarketModal} animationType="fade" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(26, 28, 46, 0.8)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 30, padding: 25, maxHeight: '80%' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#1A1C2E', marginBottom: 20 }}>📍 Mercados Perto</Text>
              {isLoadingMarkets ? <ActivityIndicator color="#46C68E" size="large" /> : (
                <FlatList data={nearbyMarkets} keyExtractor={m => m.place_id} renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => { setSelectedMarket(item); setShowMarketModal(false); }} style={{ padding: 18, backgroundColor: '#F8FAFC', borderRadius: 15, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontWeight: '800', color: '#1A1C2E', flex: 1 }}>{item.name}</Text><Text style={{ fontSize: 10, color: '#46C68E', fontWeight: '900' }}>{item.distance.toFixed(1)}km</Text></View>
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
              <TouchableWithoutFeedback><View style={{ backgroundColor: '#FFF', borderRadius: 30, padding: 25 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 20, color: '#1A1C2E', textAlign: 'center' }}>Editar Nome</Text>
                <TextInput style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 18, fontSize: 16, color: '#1A1C2E' }} value={newName} onChangeText={setNewName} autoFocus />
                <TouchableOpacity style={{ backgroundColor: '#1A1C2E', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginTop: 20 }} onPress={handleUpdateName}><Text style={{ color: '#FFF', fontWeight: '800' }}>SALVAR</Text></TouchableOpacity>
              </View></TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Footer />
      </View>
    </View>
  );
}