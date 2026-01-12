import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  KeyboardAvoidingView, Platform, Keyboard, Modal, 
  ActivityIndicator, Alert, TouchableWithoutFeedback 
} from 'react-native';
import * as Location from 'expo-location';
import Purchases from 'react-native-purchases';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../services/supabase'; 
import { useCartStore } from '../../store/cartStore';
import ShoppingItem from '../../components/ShoppingItem';
import Footer from '../../components/Footer';
import styles from './styles';
import premiumStyles from './premiumStyles';

export default function ShoppingList({ route, navigation }) {
  const { listId } = route?.params || {};
  const { items, addItem, confirmItem, removeItem, reopenItem, lists, finishList, updateListName, createList } = useCartStore();
  const isFocused = useIsFocused();
  
  const [itemName, setItemName] = useState('');
  const [unitType, setUnitType] = useState('UNIT'); 
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [nearbyMarkets, setNearbyMarkets] = useState([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
  const [bestPrices, setBestPrices] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [isPremium, setIsPremium] = useState(false);

  const currentList = lists.find(l => l.id === listId);
  const filteredItems = items.filter(i => i.listId === listId);

  const groupedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
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

  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['RISCAÊ Pro'] !== undefined);
    } catch (e) {
      console.log("Erro ao verificar premium na lista:", e);
    }
  };

  useEffect(() => {
    if (isFocused) {
      checkPremiumStatus();
    }
  }, [isFocused]);

  useEffect(() => {
    if (currentList?.lockedMarket) {
      setSelectedMarket(currentList.lockedMarket);
    }
  }, [currentList]);

  useEffect(() => {
    if (filteredItems.length > 0) {
      fetchComparisons();
    }
  }, [filteredItems.length, items]);

  const formatUpdateDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'Hoje';
    if (diffDays <= 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const fetchSuggestions = async (text) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('dicionario_produtos')
        .select('nome_limpo, marca_limpa, categoria')
        .or(`termo_original.ilike.%${text}%,nome_limpo.ilike.%${text}%`)
        .limit(5);
      if (!error && data) {
        setSuggestions(data);
      }
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    }
  };

  const handleAddItem = async (name, suggestionData = null) => {
    if (!name.trim()) return;
    let finalName = name.trim();
    let finalBrand = suggestionData?.marca_limpa || 'Genérico';
    let finalCategory = suggestionData?.categoria || 'Outros';
    let finalUnit = suggestionData?.unidade || unitType;
    if (!suggestionData) {
      const { data: dictData } = await supabase
        .from('dicionario_produtos')
        .select('nome_limpo, marca_limpa, categoria')
        .or(`termo_original.ilike.%${finalName}%,nome_limpo.ilike.%${finalName}%`)
        .limit(1)
        .maybeSingle();
      if (dictData) {
        finalName = dictData.nome_limpo;
        finalBrand = dictData.marca_limpa || 'Genérico';
        finalCategory = dictData.categoria || 'Outros';
      }
    }
    addItem(listId, finalName, finalUnit, {
      brand: finalBrand,
      category: finalCategory
    });
    setItemName('');
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const fetchComparisons = async () => {
    const itemNames = filteredItems.map(i => i.name.toLowerCase().trim());
    if (itemNames.length === 0) return;
    const { data, error } = await supabase
      .from('historico_precos')
      .select(`nome_item, preco, data_compra, mercados_id, mercados!fk_mercado_osm ( nome, endereco )`)
      .in('nome_item', itemNames)
      .order('preco', { ascending: true });

    if (!error && data) {
      const cheapestMap = {};
      data.forEach(entry => {
        const key = entry.nome_item.toLowerCase().trim();
        if (!cheapestMap[key]) {
          cheapestMap[key] = {
            preco: entry.preco,
            data: entry.data_compra,
            mercadoNome: entry.mercados?.nome || 'Mercado desconhecido',
            mercadoId: entry.mercados_id,
            mercadoEndereco: entry.mercados?.endereco || ''
          };
        }
      });
      setBestPrices(cheapestMap);
    }
  };

  const handleSegmentItem = (item, bestDeal) => {
    Alert.alert(
      "Economia Detectada!",
      `Deseja mover "${item.name}" para uma nova lista no mercado "${bestDeal.mercadoNome}"?`,
      [
        { text: "Manter aqui", style: "cancel" },
        { 
          text: "Mover para o Mercado mais barato", 
          onPress: () => {
            const segmentListName = `Economia: ${bestDeal.mercadoNome}`;
            const marketToLock = { name: bestDeal.mercadoNome, place_id: bestDeal.mercadoId, address: bestDeal.mercadoEndereco };
            let targetList = lists.find(l => l.name === segmentListName && !l.finished && l.lockedMarket?.place_id === marketToLock.place_id);
            let targetListId = targetList ? targetList.id : createList(segmentListName, marketToLock);
            addItem(targetListId, item.name, item.unitType, { brand: item.brand, category: item.category, amount: item.amount, price: bestDeal.preco });
            removeItem(item.id);
          }
        }
      ]
    );
  };

  const calculateTotalSavings = () => {
    let total = 0;
    filteredItems.forEach(item => {
      const bestDeal = bestPrices[item.name.toLowerCase().trim()];
      if (bestDeal) {
        const userPrice = item.price || 0;
        const amount = item.amount || 1;
        if (userPrice > bestDeal.preco) {
          total += (userPrice - bestDeal.preco) * amount;
        } else if (userPrice === 0) {
          total += 0.50 * amount;
        }
      }
    });
    return total;
  };

  const handleUpdateName = () => {
    if (newName.trim()) {
      updateListName(listId, newName);
      setShowEditModal(false);
      setNewName('');
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
      const delta = 0.045;
      const viewbox = `${longitude - delta},${latitude + delta},${longitude + delta},${latitude - delta}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=supermarket&lat=${latitude}&lon=${longitude}&bounded=1&viewbox=${viewbox}&limit=50`;
      const response = await fetch(url, { headers: { 'User-Agent': 'RiscaE_App' } });
      const data = await response.json();
      setNearbyMarkets(data.map(m => ({
        name: m.display_name.split(',')[0],
        place_id: m.place_id.toString(),
        address: m.display_name.split(',').slice(1, 3).join(',')
      })));
    } catch (error) { console.error(error); } finally { setIsLoadingMarkets(false); }
  };

  const PriceComparisonLabel = ({ item }) => {
    const bestDeal = bestPrices[item.name.toLowerCase().trim()];
    if (!bestDeal) return <View style={{ marginBottom: 10 }} />;
    
    const userPrice = item.price || 0;
    const isPayingMore = userPrice > bestDeal.preco;
    const amount = item.amount || 1;
    const diff = userPrice > 0 ? (userPrice - bestDeal.preco) : 0.50;

    if (!isPremium) {
      return (
        <TouchableOpacity style={{ paddingHorizontal: 20, marginBottom: 15 }} onPress={() => navigation.navigate('Paywall')}>
          <View style={{ backgroundColor: '#F0F9FF', padding: 12, borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#0EA5E9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#0369A1', fontWeight: '900' }}>
                {item.completed 
                  ? `🔥 Você economizaria R$ ${(diff * amount).toFixed(2)} aqui!` 
                  : "💡 Menor preço detectado para este item!"
                }
              </Text>
              <Text style={{ fontSize: 9, color: '#0EA5E9', fontWeight: '600' }}>Toque para revelar valor e mercado</Text>
            </View>
            <Text style={{ fontSize: 16 }}>🔒</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.completed && isPayingMore) {
      return (
        <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
          <TouchableOpacity onPress={() => handleSegmentItem(item, bestDeal)} style={{ backgroundColor: '#FEF2F2', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#991B1B', fontWeight: '900' }}>⚠️ R$ {(diff * amount).toFixed(2)} A MAIS NESTA COMPRA!</Text>
              <Text style={{ fontSize: 8, color: '#FCA5A5', fontWeight: 'bold' }}>{formatUpdateDate(bestDeal.data)}</Text>
            </View>
            <Text style={{ fontSize: 10, color: '#B91C1C', marginTop: 2 }}>Melhor preço: <Text style={{ fontWeight: '800' }}>R$ {bestDeal.preco.toFixed(2)}</Text> no <Text style={{ fontWeight: '800' }}>{bestDeal.mercadoNome}</Text>.</Text>
            <Text style={{ fontSize: 9, color: '#EF4444', fontWeight: 'bold', marginTop: 4 }}>CLIQUE PARA MOVER O ITEM PARA NOVA LISTA➔</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.completed) return <View style={{ marginBottom: 10 }} />;
    return (
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <View style={{ backgroundColor: '#F0FDF4', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'column', borderLeftWidth: 4, borderLeftColor: '#46C68E' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 11, color: '#166534', fontWeight: '600' }}>✨ Melhor preço: <Text style={{ fontWeight: '900' }}>R$ {bestDeal.preco.toFixed(2)}</Text></Text>
            <Text style={{ fontSize: 9, color: '#94A3B8', fontWeight: 'bold' }}>ATUALIZADO: {formatUpdateDate(bestDeal.data)}</Text>
          </View>
          <Text style={{ fontSize: 10, color: '#166534' }}>No mercado <Text style={{ fontWeight: '900' }}>{bestDeal.mercadoNome}</Text>.</Text>
        </View>
      </View>
    );
  };

  const totalSavings = calculateTotalSavings();

  if (!currentList) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#46C68E" />
        <Text style={{ marginTop: 10, color: '#94A3B8' }}>Carregando lista...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { flex: 1, backgroundColor: '#FFF' }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { marginBottom: 0, paddingRight: 10 }]}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
            <TouchableOpacity onPress={() => isPremium ? navigation.navigate('PriceIntelligence', { listId }) : navigation.navigate('Paywall')} style={[premiumStyles.intelligenceBtn, { paddingHorizontal: 10, height: 32, justifyContent: 'center', backgroundColor: isPremium ? '#1A1C2E' : '#46C68E' }]}>
              <Text style={[premiumStyles.intelligenceBtnText, { fontSize: 9, fontWeight: '900' }]} numberOfLines={1}>{isPremium ? '🚀 INTEL.' : '💎 UPGRADE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if(!currentList?.lockedMarket) { setShowMarketModal(true); fetchMarketsOSM(); } }} style={{ backgroundColor: selectedMarket ? '#F0FDF4' : '#1A1C2E', paddingHorizontal: 8, height: 32, borderRadius: 8, borderWidth: 1, borderColor: selectedMarket ? '#46C68E' : 'transparent', maxWidth: 120, justifyContent: 'center', opacity: currentList?.lockedMarket ? 0.8 : 1 }}>
              <Text style={{ color: selectedMarket ? '#46C68E' : '#FFF', fontSize: 9, fontWeight: '900', textAlign: 'center' }} numberOfLines={1}>{selectedMarket ? `📍 ${selectedMarket.name.toUpperCase()}` : '📍 ONDE?'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>LISTA ATUAL</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.title, { marginRight: 8, flexShrink: 1 }]} numberOfLines={1}>{currentList?.name}</Text>
              <TouchableOpacity onPress={() => { setNewName(currentList?.name); setShowEditModal(true); }}><Text style={{ fontSize: 10, color: '#46C68E', fontWeight: '900' }}>(EDITAR)</Text></TouchableOpacity>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#1A1C2E' }}>R$ {currentList?.total?.toFixed(2) || "0.00"}</Text>
            {!isPremium && totalSavings > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Paywall')} style={{ backgroundColor: '#46C68E15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#166534' }}>ECONOMIZE R$ {totalSavings.toFixed(2)} 💎</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList 
          data={groupedItems}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <View style={{ padding: 20, zIndex: 10 }}>
              <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 6, alignItems: 'center' }}>
                <TouchableOpacity 
                  onPress={() => setUnitType(prev => prev === 'UNIT' ? 'KG' : 'UNIT')}
                  style={{ backgroundColor: '#1A1C2E', paddingHorizontal: 12, height: 44, borderRadius: 12, justifyContent: 'center', marginRight: 5 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>{unitType === 'UNIT' ? 'UN' : 'KG'}</Text>
                </TouchableOpacity>
                <TextInput 
                  style={{ flex: 1, height: 50, paddingHorizontal: 10, fontSize: 16, fontWeight: '600' }} 
                  placeholder="O que vamos comprar?" 
                  value={itemName} 
                  onChangeText={(text) => { setItemName(text); fetchSuggestions(text); }} 
                />
                <TouchableOpacity onPress={() => handleAddItem(itemName)} style={{ backgroundColor: '#1A1C2E', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontSize: 24 }}>+</Text></TouchableOpacity>
              </View>
              {suggestions.length > 0 && (
                <View style={{ backgroundColor: '#FFF', marginTop: 5, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity key={index} style={{ padding: 15, borderBottomWidth: index === suggestions.length - 1 ? 0 : 1, borderBottomColor: '#F1F5F9' }} onPress={() => handleAddItem(suggestion.nome_limpo, suggestion)}>
                      <Text style={{ fontWeight: '600', color: '#1A1C2E' }}>{suggestion.nome_limpo} <Text style={{ fontWeight: '400', color: '#94A3B8' }}>({suggestion.marca_limpa || 'Genérico'})</Text></Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => {
            if (item.isHeader) {
              return (
                <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, backgroundColor: '#FFF' }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2 }}>{item.title.toUpperCase()}</Text>
                </View>
              );
            }
            return (
              <View>
                <ShoppingItem item={item} onConfirm={confirmItem} onRemove={removeItem} onReopen={reopenItem} suggestedPrice={bestPrices[item.name.toLowerCase().trim()]?.preco} />
                <PriceComparisonLabel item={item} />
              </View>
            );
          }}
        />
      </KeyboardAvoidingView>

      <View style={{ padding: 20, backgroundColor: '#FFF' }}>
        <TouchableOpacity onPress={() => { if (!selectedMarket) { setShowMarketModal(true); return; } finishList(listId, selectedMarket); navigation.navigate('Dashboard'); }} style={{ backgroundColor: '#46C68E', padding: 18, borderRadius: 20, alignItems: 'center', shadowColor: "#46C68E", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5 }}>
          <Text style={{ color: '#FFF', fontWeight: '900', letterSpacing: 1 }}>{selectedMarket ? 'FINALIZAR COMPRA' : 'SELECIONE O MERCADO PARA SALVAR'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showMarketModal} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(26, 28, 46, 0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 30, padding: 25, maxHeight: '80%' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', marginBottom: 20, color: '#1A1C2E' }}>📍 Mercados Próximos (~5km)</Text>
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
  );
}