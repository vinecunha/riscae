import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  KeyboardAvoidingView, Platform, Keyboard, Modal, 
  ActivityIndicator, Alert, TouchableWithoutFeedback 
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../services/supabase'; 
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import ShoppingItem from '../../components/ShoppingItem';
import Footer from '../../components/Footer';
import styles from './styles';
import premiumStyles from './premiumStyles';

export default function ShoppingList({ route, navigation }) {
  const { listId } = route?.params || {};
  const { items, addItem, confirmItem, removeItem, reopenItem, lists, finishList, updateListName } = useCartStore();
  const { isPremium } = useAuthStore();
  
  const [itemName, setItemName] = useState('');
  const [unitType, setUnitType] = useState('UNIT');
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [nearbyMarkets, setNearbyMarkets] = useState([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
  const [bestPrices, setBestPrices] = useState({});

  const currentList = lists.find(l => l.id === listId);
  const filteredItems = items.filter(i => i.listId === listId);

  useEffect(() => {
    if (filteredItems.length > 0) {
      fetchComparisons();
    }
  }, [filteredItems.length]);

  const fetchComparisons = async () => {
    const itemNames = filteredItems.map(i => i.name.toLowerCase().trim());
    
    const { data, error } = await supabase
      .from('historico_precos')
      .select(`
        nome_item, 
        preco, 
        mercados_id,
        mercados!fk_mercado_osm (
          nome
        )
      `)
      .in('nome_item', itemNames)
      .order('preco', { ascending: true });

    if (error) {
      console.error("Erro busca comparativa:", error);
      return;
    }

    if (data) {
      const cheapestMap = {};
      data.forEach(entry => {
        const key = entry.nome_item.toLowerCase().trim();
        if (!cheapestMap[key]) {
          cheapestMap[key] = {
            preco: entry.preco,
            mercadoNome: entry.mercados?.nome || 'Mercado desconhecido'
          };
        }
      });
      setBestPrices(cheapestMap);
    }
  };

  // Cálculo da economia total da lista
  const calculateTotalSavings = () => {
    let savings = 0;
    filteredItems.forEach(item => {
      const bestDeal = bestPrices[item.name.toLowerCase().trim()];
      if (bestDeal) {
        // Se o usuário já deu um preço, compara. Se não, usa o preço do banco como base de economia
        const userPrice = item.price || 0;
        if (userPrice > bestDeal.preco) {
          savings += (userPrice - bestDeal.preco) * (item.amount || 1);
        } else if (userPrice === 0) {
          // Atiçador: se ele não pos preço, apenas sugerimos que há algo mais barato (ex: média de 1.00 de economia por item)
          savings += 0.50; 
        }
      }
    });
    return savings;
  };

  const handleUpdateName = () => {
    if (newName.trim()) {
      updateListName(listId, newName);
      setShowEditModal(false);
      setNewName('');
    }
  };

  const fetchMarketsOSM = async () => {
    setIsLoadingMarkets(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const delta = 0.045;
      const viewbox = `${longitude - delta},${latitude + delta},${longitude + delta},${latitude - delta}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=supermarket&lat=${latitude}&lon=${longitude}&bounded=1&viewbox=${viewbox}&limit=15`;
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

    if (!isPremium) {
      const userPrice = item.price || 0;
      const isUserPayingMore = userPrice > bestDeal.preco;
      const showLabel = !item.completed || isUserPayingMore;

      if (!showLabel) return <View style={{ marginBottom: 10 }} />;

      const diff = userPrice > bestDeal.preco ? userPrice - bestDeal.preco : null;

      return (
        <TouchableOpacity 
          style={{ paddingHorizontal: 20, marginBottom: 15 }}
          onPress={() => navigation.navigate('Paywall')}
        >
          <View style={{ 
            backgroundColor: '#F0F9FF', padding: 12, borderRadius: 14, 
            borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#0EA5E9', 
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#0369A1', fontWeight: '900' }}>
                {diff 
                  ? `🔥 Você economizaria R$ ${diff.toFixed(2)} aqui!` 
                  : "💡 Menor preço detectado para este item!"}
              </Text>
              <Text style={{ fontSize: 9, color: '#0EA5E9', fontWeight: '600' }}>Toque para revelar valor e mercado</Text>
            </View>
            <Text style={{ fontSize: 16 }}>🔒</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.completed) return <View style={{ marginBottom: 10 }} />;

    return (
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <View style={{ 
          backgroundColor: '#F0FDF4', paddingVertical: 8, paddingHorizontal: 12, 
          borderRadius: 12, flexDirection: 'row', alignItems: 'center',
          borderLeftWidth: 4, borderLeftColor: '#46C68E'
        }}>
          <Text style={{ fontSize: 11, color: '#166534', fontWeight: '600' }}>
            ✨ Melhor preço: <Text style={{ fontWeight: '900' }}>R$ {bestDeal.preco.toFixed(2)}</Text> no {bestDeal.mercadoNome}
          </Text>
        </View>
      </View>
    );
  };

  const totalSavings = calculateTotalSavings();

  return (
    <View style={[styles.container, { flex: 1, backgroundColor: '#FFF' }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { marginBottom: 0, paddingRight: 10 }]}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
            <TouchableOpacity 
              onPress={() => isPremium ? navigation.navigate('PriceIntelligence', { listId }) : navigation.navigate('Paywall')}
              style={[
                premiumStyles.intelligenceBtn, 
                { paddingHorizontal: 10, height: 32, justifyContent: 'center', backgroundColor: isPremium ? '#1A1C2E' : '#46C68E' }
              ]}
            >
              <Text style={[premiumStyles.intelligenceBtnText, { fontSize: 9, fontWeight: '900' }]} numberOfLines={1}>
                {isPremium ? '🚀 INTEL.' : '💎 UPGRADE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => { setShowMarketModal(true); fetchMarketsOSM(); }}
              style={{ 
                backgroundColor: selectedMarket ? '#F0FDF4' : '#1A1C2E', 
                paddingHorizontal: 8, height: 32, borderRadius: 8,
                borderWidth: 1, borderColor: selectedMarket ? '#46C68E' : 'transparent',
                maxWidth: 120, justifyContent: 'center'
              }}
            >
              <Text style={{ color: selectedMarket ? '#46C68E' : '#FFF', fontSize: 9, fontWeight: '900', textAlign: 'center' }} numberOfLines={1}>
                {selectedMarket ? `📍 ${selectedMarket.name.toUpperCase()}` : '📍 ONDE?'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>LISTA ATUAL</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.title, { marginRight: 8, flexShrink: 1 }]} numberOfLines={1}>{currentList?.name}</Text>
              <TouchableOpacity onPress={() => { setNewName(currentList?.name); setShowEditModal(true); }}>
                <Text style={{ fontSize: 10, color: '#46C68E', fontWeight: '900' }}>(EDITAR)</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#1A1C2E' }}>
              R$ {currentList?.total?.toFixed(2) || "0.00"}
            </Text>
            
            {/* NOVO: ATIÇADOR DE ECONOMIA TOTAL */}
            {!isPremium && totalSavings > 0 && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Paywall')}
                style={{ 
                  backgroundColor: '#46C68E15', 
                  paddingHorizontal: 8, 
                  paddingVertical: 2, 
                  borderRadius: 6, 
                  marginTop: 2,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#166534' }}>
                  ECONOMIZE ATÉ R$ {totalSavings.toFixed(2)} 💎
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList 
          data={filteredItems.sort((a,b) => a.completed - b.completed)}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 6 }}>
                <TextInput 
                  style={{ flex: 1, height: 50, paddingHorizontal: 15, fontSize: 16, fontWeight: '600' }} 
                  placeholder="O que vamos comprar?" 
                  value={itemName}
                  onChangeText={setItemName}
                />
                <TouchableOpacity 
                  onPress={() => { addItem(listId, itemName, unitType); setItemName(''); Keyboard.dismiss(); }}
                  style={{ backgroundColor: '#1A1C2E', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontSize: 24 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View>
              <ShoppingItem 
                item={item} 
                onConfirm={confirmItem} 
                onRemove={removeItem} 
                onReopen={reopenItem} 
              />
              <PriceComparisonLabel item={item} />
            </View>
          )}
        />
      </KeyboardAvoidingView>

      <View style={{ padding: 20, backgroundColor: '#FFF' }}>
        <TouchableOpacity 
          onPress={() => {
            if (!selectedMarket) { setShowMarketModal(true); return; }
            finishList(listId, selectedMarket);
            navigation.navigate('Dashboard');
          }}
          style={{ 
            backgroundColor: '#46C68E', padding: 18, borderRadius: 20, alignItems: 'center',
            shadowColor: "#46C68E", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '900', letterSpacing: 1 }}>
            {selectedMarket ? 'FINALIZAR COMPRA' : 'SELECIONE O MERCADO PARA SALVAR'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showMarketModal} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(26, 28, 46, 0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 30, padding: 25, maxHeight: '80%' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', marginBottom: 20, color: '#1A1C2E' }}>📍 Mercados Próximos (~5km)</Text>
            {isLoadingMarkets ? <ActivityIndicator color="#46C68E" size="large" /> : (
              <FlatList
                data={nearbyMarkets}
                keyExtractor={m => m.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    onPress={() => { setSelectedMarket(item); setShowMarketModal(false); }}
                    style={{ padding: 18, backgroundColor: '#F8FAFC', borderRadius: 15, marginBottom: 10 }}
                  >
                    <Text style={{ fontWeight: '800', color: '#1A1C2E' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>{item.address}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity onPress={() => setShowMarketModal(false)} style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontWeight: '700' }}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="fade" transparent>
        <TouchableWithoutFeedback onPress={() => setShowEditModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(26, 28, 46, 0.8)', justifyContent: 'center', padding: 20 }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: '#FFF', borderRadius: 30, padding: 25 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 20, color: '#1A1C2E', textAlign: 'center' }}>Editar Nome da Lista</Text>
                <TextInput 
                  style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 18, fontSize: 16, color: '#1A1C2E', borderWidth: 1, borderColor: '#F1F5F9' }} 
                  value={newName} 
                  onChangeText={setNewName} 
                  autoFocus 
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={() => setShowEditModal(false)}>
                    <Text style={{ color: '#64748B', fontWeight: '700' }}>CANCELAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1.5, backgroundColor: '#1A1C2E', paddingVertical: 15, borderRadius: 15, alignItems: 'center' }} onPress={handleUpdateName}>
                    <Text style={{ color: '#FFF', fontWeight: '800' }}>SALVAR</Text>
                  </TouchableOpacity>
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