import React from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  KeyboardAvoidingView, Platform, Keyboard,
  ActivityIndicator, StatusBar, SafeAreaView
} from 'react-native';
import { useShoppingListLogic } from './useShoppingListLogic';
import ShoppingItem from '../../components/ShoppingItem';
import Footer from '../../components/Footer';
import { MarketModal, SavingsModal, EditModal } from './ShoppingModals';
import styles from './styles';

export default function ShoppingList({ route, navigation }) {
  const { listId } = route?.params || {};
  const logic = useShoppingListLogic(listId, navigation);

  const IntelSavingsBanner = () => {
    if (logic.isFocusedMode || logic.totalSavings <= 0) return null;
    return (
      <TouchableOpacity 
        onPress={() => logic.isPremium ? navigation.navigate('PriceIntelligence', { listId }) : navigation.navigate('Paywall')} 
        style={{ marginHorizontal: 20, marginBottom: 15, backgroundColor: '#F0FDF4', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#46C68E', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View>
          <Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold' }}>ECONOMIA POSSÍVEL</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#14532D' }}>R$ {logic.totalSavings.toFixed(2)}</Text>
        </View>
        <View style={{ backgroundColor: '#46C68E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>VER DETALHES ➔</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const PriceComparisonLabel = ({ item }) => {
    if (logic.isFocusedMode) return null;
    const bestDeal = logic.bestPrices[item.name.toLowerCase().trim()];
    if (!bestDeal) return <View style={{ marginBottom: 10 }} />;
    
    const isPayingMore = item.completed && Number(item.price) > Number(bestDeal.preco);
    if (isPayingMore) return (
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <TouchableOpacity 
          onPress={() => logic.handleSegmentItem(item, bestDeal)} 
          style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}
        >
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

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <View style={{ height: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight }} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.container, { flex: 1 }]}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, marginTop: Platform.OS === 'ios' ? 0 : 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 5 }}>
                  <Text style={styles.backText}>← Voltar</Text>
                </TouchableOpacity>
                {!logic.isFocusedMode && (
                  <TouchableOpacity onPress={logic.handleOfflineSync} disabled={logic.isSyncingOffline} style={{ backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                    {logic.isSyncingOffline ? <ActivityIndicator size="small" color="#1A1C2E" /> : <Text style={{ fontSize: 14 }}>📵</Text>}
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                <TouchableOpacity 
                  onPress={() => logic.setIsFocusedMode(!logic.isFocusedMode)} 
                  style={{ backgroundColor: logic.isFocusedMode ? '#1A1C2E' : '#F1F5F9', paddingHorizontal: 8, height: 32, borderRadius: 8, justifyContent: 'center' }}
                >
                  <Text style={{ color: logic.isFocusedMode ? '#FFF' : '#1A1C2E', fontSize: 8, fontWeight: '900' }}>
                    {logic.isFocusedMode ? '⚡ RÁPIDO' : '📱 NORMAL'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => logic.openMarketModal()} 
                  style={{ backgroundColor: logic.selectedMarket ? '#F0FDF4' : '#1A1C2E', paddingHorizontal: 8, height: 32, borderRadius: 8, borderWidth: 1, borderColor: logic.selectedMarket ? '#46C68E' : 'transparent', maxWidth: 100, flexShrink: 1, justifyContent: 'center' }}
                >
                  <Text style={{ color: logic.selectedMarket ? '#46C68E' : '#FFF', fontSize: 8, fontWeight: '900' }} numberOfLines={1}>
                    {logic.selectedMarket ? `📍 ${logic.selectedMarket.name.toUpperCase()}` : '📍 ONDE?'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {!logic.isFocusedMode && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>LISTA ATUAL</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1C2E', flexShrink: 1 }} numberOfLines={1}>{logic.currentList?.name}</Text>
                    <TouchableOpacity onPress={() => logic.openEditModal()} style={{ marginLeft: 8 }}>
                      <Text style={{ fontSize: 10, color: '#46C68E', fontWeight: '900' }}>EDITAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1C2E' }}>R$ {logic.currentList?.total?.toFixed(2) || "0.00"}</Text>
                </View>
              </View>
            )}
          </View>

          <IntelSavingsBanner />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <FlatList 
              data={logic.groupedItems} 
              keyExtractor={item => item.id}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 40, marginBottom: 20 }}>🛒</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1C2E', textAlign: 'center' }}>Sua lista está vazia!</Text>
                  <TouchableOpacity onPress={logic.handleDeleteList} style={{ marginTop: 25, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#FEF2F2', borderRadius: 12 }}>
                    <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 11 }}>EXCLUIR ESTA LISTA</Text>
                  </TouchableOpacity>
                </View>
              }
              ListHeaderComponent={
                <View>
                  {logic.uploadQueue.length > 0 && (
                    <View style={{ backgroundColor: '#F59E0B', paddingVertical: 4, alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>⏳ SINCRONIZANDO {logic.uploadQueue.length} PREÇOS...</Text>
                    </View>
                  )}
                  {!logic.isFocusedMode && (
                    <View style={{ padding: 20 }}>
                      <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 6, alignItems: 'center' }}>
                        <TouchableOpacity 
                          onPress={() => logic.toggleUnit()} 
                          style={{ backgroundColor: '#1A1C2E', paddingHorizontal: 12, height: 44, borderRadius: 12, justifyContent: 'center', marginRight: 5 }}
                        >
                          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>{logic.unitType === 'UNIT' ? 'UN' : 'KG'}</Text>
                        </TouchableOpacity>
                        <TextInput 
                          style={{ flex: 1, height: 50, paddingHorizontal: 10, fontSize: 16, fontWeight: '600' }} 
                          placeholder="O que vamos comprar?" 
                          value={logic.itemName} 
                          onChangeText={logic.setItemName} 
                        />
                        <TouchableOpacity onPress={logic.handleAddItem} style={{ backgroundColor: '#1A1C2E', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#FFF', fontSize: 24 }}>+</Text>
                        </TouchableOpacity>
                      </View>
                      {logic.suggestions.length > 0 && (
                        <View style={{ backgroundColor: '#FFF', borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                          {logic.suggestions.map((sug, index) => (
                            <TouchableOpacity 
                              key={index} 
                              style={{ padding: 15, borderBottomWidth: index === logic.suggestions.length - 1 ? 0 : 1, borderBottomColor: '#F1F5F9' }} 
                              onPress={() => logic.selectSuggestion(sug)}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <View>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1C2E' }}>{sug.name}</Text>
                                    <Text style={{ fontSize: 8, color: '#94A3B8', fontWeight: 'bold' }}>{sug.source === 'dict' ? '📚 SUGERIDO' : '🕒 JÁ COMPRADO'}</Text>
                                  </View>
                                  <Text style={{ fontSize: 10, color: '#94A3B8' }}>{sug.category}</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              }
              renderItem={({ item }) => item.isHeader ? 
                <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 }}><Text style={{ fontSize: 11, fontWeight: '900', color: '#94A3B8' }}>{item.title.toUpperCase()}</Text></View> :
                <View>
                  <ShoppingItem 
                    item={item} 
                    onConfirm={logic.confirmItem} 
                    onRemove={logic.removeItem} 
                    onReopen={logic.reopenItem} 
                    suggestedPrice={logic.bestPrices[item.name.toLowerCase().trim()]?.preco} 
                    isFocusedMode={logic.isFocusedMode} 
                  />
                  <PriceComparisonLabel item={item} />
                </View>
              }
            />
          </KeyboardAvoidingView>

          <View style={{ padding: 20, backgroundColor: '#FFF' }}>
            <TouchableOpacity onPress={logic.handleFinalizeWithCheck} style={{ backgroundColor: '#46C68E', padding: 18, borderRadius: 20, alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: '900' }}>
                {logic.selectedMarket ? `FINALIZAR POR R$ ${logic.currentList?.total?.toFixed(2) || "0.00"}` : 'SELECIONE O MERCADO'}
              </Text>
            </TouchableOpacity>
          </View>

          <SavingsModal 
            visible={logic.showSavingsModal} 
            data={logic.savingsData} 
            onConfirm={logic.confirmSegmentation} 
            onCancel={logic.finalizeAnyway} 
          />

          <MarketModal 
            visible={logic.showMarketModal} 
            loading={logic.isLoadingMarkets}
            markets={logic.nearbyMarkets}
            sortType={logic.sortType}
            onSort={logic.sortMarkets}
            onSelect={logic.selectMarket}
            onClose={() => logic.setShowMarketModal(false)}
          />

          <EditModal 
            visible={logic.showEditModal} 
            value={logic.newName} 
            onChange={logic.setNewName} 
            onSave={logic.handleUpdateName} 
            onClose={() => logic.setShowEditModal(false)} 
          />

          <Footer />
        </View>
      </SafeAreaView>
    </View>
  );
}