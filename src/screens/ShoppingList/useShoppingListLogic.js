import { useState, useEffect, useMemo, useRef } from 'react';
import { Alert, Keyboard } from 'react-native';
import * as Location from 'expo-location';
import Purchases from 'react-native-purchases';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../services/supabase'; 
import { useCartStore } from '../../store/cartStore';

export function useShoppingListLogic(listId, navigation) {
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
  const [sortType, setSortType] = useState('distance'); 
  const [suggestions, setSuggestions] = useState([]);

  const currentList = lists.find(l => l.id === listId);
  const filteredItems = items.filter(i => i.listId === listId);

  // Grouping logic
  const groupedItems = useMemo(() => {
    let listToGroup = [...filteredItems];
    const sorted = listToGroup.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.category || 'Outros').localeCompare(b.category || 'Outros');
    });
    const result = [];
    let lastCat = null;
    sorted.forEach(item => {
      if (!item.completed && item.category !== lastCat) {
        result.push({ isHeader: true, title: item.category || 'Outros', id: `h-${item.category}` });
        lastCat = item.category;
      } else if (item.completed && lastCat !== 'Completados') {
        result.push({ isHeader: true, title: 'Completados', id: 'h-comp' });
        lastCat = 'Completados';
      }
      result.push(item);
    });
    return result;
  }, [filteredItems]);

  // Calculations
  const totalSavings = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const best = bestPrices[item.name.toLowerCase().trim()];
      if (best) {
        const diff = (Number(item.price) || 0.50) - best.preco;
        return diff > 0 ? acc + (diff * (item.amount || 1)) : acc;
      }
      return acc;
    }, 0);
  }, [filteredItems, bestPrices]);

  // Effects
  useEffect(() => {
    if (isFocused) {
      checkPremiumStatus();
      syncData();
    }
  }, [isFocused]);

  // CORREÇÃO: useEffect de sugestões otimizado
  useEffect(() => {
    if (itemName.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(t);
  }, [itemName]);

  useEffect(() => { if (currentList?.lockedMarket) setSelectedMarket(currentList.lockedMarket); }, [currentList]);
  useEffect(() => { if (filteredItems.length > 0) fetchComparisons(); }, [filteredItems.length]);

  // Actions
  const syncData = async () => {
    try { await processQueue(); await restoreBackup(true); } catch (e) {}
  };

  const checkPremiumStatus = async () => {
    if (isCheckingPremium.current) return;
    isCheckingPremium.current = true;
    try {
      const info = await Purchases.getCustomerInfo();
      setIsPremium(!!info.entitlements.active['RISCAÊ Pro']);
    } catch (e) {} finally { isCheckingPremium.current = false; }
  };

  const fetchSuggestions = async () => {
    const query = itemName.toLowerCase().trim();
    if (!query) return;

    try {
      const { data: d1 } = await supabase.from('dicionario_produtos').select('termo_principal, categoria, unidade_sugerida').or(`termo_principal.ilike.%${query}%,sinonimos.cs.{"${query}"}`).limit(5);
      const { data: d2 } = await supabase.from('historico_precos').select('nome_item, categoria, unidade').ilike('nome_item', `%${query}%`).limit(5);
      
      const combined = (d1 || []).map(x => ({ name: x.termo_principal, category: x.categoria, unit: x.unidade_sugerida, source: 'dict' }));
      
      (d2 || []).forEach(x => {
        if (!combined.find(c => c.name.toLowerCase() === x.nome_item.toLowerCase())) {
          combined.push({ name: x.nome_item, category: x.categoria, unit: x.unidade, source: 'hist' });
        }
      });
      setSuggestions(combined.slice(0, 6));
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    }
  };

  const fetchComparisons = async () => {
    const names = filteredItems.map(i => i.name.toLowerCase().trim());
    const { data } = await supabase.from('historico_precos').select(`nome_item, preco, mercados_id, mercados!fk_mercado_osm(nome, endereco)`).in('nome_item', names).order('preco', { ascending: true });
    if (data) {
      const map = {};
      data.forEach(e => {
        const k = e.nome_item.toLowerCase().trim();
        if (!map[k]) map[k] = { preco: Number(e.preco), mercadoNome: e.mercados?.nome, mercadoId: String(e.mercados_id), mercadoEndereco: e.mercados?.endereco };
      });
      setBestPrices(map);
    }
  };

  const sortMarkets = (type) => {
    const sorted = [...nearbyMarkets].sort((a, b) => {
      if (type === 'distance') return a.distance - b.distance;
      return a.name.localeCompare(b.name);
    });
    setNearbyMarkets(sorted);
    setSortType(type);
  };

  const fetchMarketsOSM = async () => {
    setIsLoadingMarkets(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=supermarket&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&bounded=1&viewbox=${loc.coords.longitude-0.04},${loc.coords.latitude+0.04},${loc.coords.longitude+0.04},${loc.coords.latitude-0.04}&limit=30`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RiscaE' } });
      const data = await res.json();
      const mapped = data.map(m => ({
        name: m.display_name.split(',')[0],
        place_id: String(m.place_id),
        address: m.display_name.split(',').slice(1, 4).join(','), 
        distance: calculateDistance(loc.coords.latitude, loc.coords.longitude, parseFloat(m.lat), parseFloat(m.lon))
      }));
      setNearbyMarkets(mapped.sort((a,b) => a.distance - b.distance));
    } catch (e) {} finally { setIsLoadingMarkets(false); }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // CORREÇÃO: handleAddItem agora reseta sugestões
  const handleAddItem = () => { 
    if(itemName.trim()) { 
      addItem(listId, itemName, unitType); 
      setItemName(''); 
      setSuggestions([]); 
    }
  };

  return {
    itemName, setItemName, unitType, setUnitType, suggestions,
    showMarketModal, setShowMarketModal, showEditModal, setShowEditModal,
    showSavingsModal, savingsData, newName, setNewName,
    selectedMarket, nearbyMarkets, isLoadingMarkets, isSyncingOffline,
    bestPrices, isPremium, isFocusedMode, setIsFocusedMode,
    currentList, groupedItems, uploadQueue, totalSavings, sortType,
    toggleUnit: () => setUnitType(v => v === 'UNIT' ? 'KG' : 'UNIT'),
    selectSuggestion: (sug) => { 
      addItem(listId, sug.name, sug.unit === 'KG' ? 'KG' : 'UNIT', { category: sug.category }); 
      setItemName(''); 
      setSuggestions([]); 
      Keyboard.dismiss(); 
    },
    openMarketModal: () => { setShowMarketModal(true); fetchMarketsOSM(); },
    openEditModal: () => { setNewName(currentList?.name); setShowEditModal(true); },
    selectMarket: (m) => { setSelectedMarket(m); setShowMarketModal(false); },
    sortMarkets,
    confirmItem, removeItem, reopenItem,
    handleUpdateName: () => { if(newName.trim()){ updateListName(listId, newName); setShowEditModal(false); }},
    handleDeleteList: () => Alert.alert("Excluir?", "Deseja remover esta lista?", [{text: "Não"}, {text: "Sim", onPress: () => {removeList(listId); navigation.goBack();}}]),
    handleOfflineSync: async () => {
        setIsSyncingOffline(true);
        const res = await syncOfflinePrices(filteredItems.map(i => i.name));
        setIsSyncingOffline(false);
        if(res === "SUCCESS") { Alert.alert("OK", "Preços sincronizados!"); fetchComparisons(); }
    },
    handleAddItem,
    handleFinalizeWithCheck: () => {
        if (!selectedMarket) return setShowMarketModal(true);
        if (totalSavings > 0.5) { setSavingsData({ total: totalSavings, items: filteredItems.filter(i => i.completed && bestPrices[i.name.toLowerCase().trim()]?.preco < i.price) }); setShowSavingsModal(true); }
        else { finishList(listId, selectedMarket); navigation.navigate('Dashboard'); }
    },
    confirmSegmentation: () => { 
        savingsData.items.forEach(i => handleSegmentItem(i, bestPrices[i.name.toLowerCase().trim()]));
        setShowSavingsModal(false); finishList(listId, selectedMarket); navigation.navigate('Dashboard');
    },
    finalizeAnyway: () => { setShowSavingsModal(false); finishList(listId, selectedMarket); navigation.navigate('Dashboard'); },
    handleSegmentItem: (item, best) => {
        const m = { name: best.mercadoNome, place_id: String(best.mercadoId), address: best.mercadoEndereco };
        const tid = addList(`🆕 PRO @ ${best.mercadoNome}`, m);
        addItem(tid, item.name, item.unitType, { ...item, price: best.preco });
        removeItem(item.id);
    }
  };
}