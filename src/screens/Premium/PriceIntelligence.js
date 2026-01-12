import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../services/supabase';
import premiumStyles from '../ShoppingList/premiumStyles';

export default function PriceIntelligence({ route, navigation }) {
  const { listId } = route.params;
  const { items, lists } = useCartStore();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentList = lists.find(l => l.id === listId);
  const filteredItems = items.filter(i => i.listId === listId);

  useEffect(() => {
    analyzePrices();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Data ignorada';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const analyzePrices = async () => {
    setLoading(true);
    const itemNames = filteredItems.map(i => i.name.toLowerCase().trim());
    
    if (itemNames.length === 0) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('historico_precos')
      .select(`
        nome_item, 
        preco, 
        data_compra,
        mercados_id,
        mercados!fk_mercado_osm (
          nome,
          endereco
        )
      `)
      .in('nome_item', itemNames)
      .order('preco', { ascending: true });

    if (error) console.error("Erro na busca:", error);

    if (data) {
      const bestDeals = {};
      data.forEach(entry => {
        const key = entry.nome_item.toLowerCase().trim();
        // O order by preco ascending já garante que o primeiro de cada nome é o mais barato
        if (!bestDeals[key]) {
          bestDeals[key] = entry;
        }
      });
      setReport(Object.values(bestDeals));
    }
    setLoading(false);
  };

  const renderItem = ({ item }) => {
    // Busca o item correspondente na lista atual do usuário para comparar o preço
    const userItem = filteredItems.find(i => i.name.toLowerCase().trim() === item.nome_item.toLowerCase().trim());
    const userPrice = userItem?.price || 0;
    const isPayingMore = userPrice > item.preco && userPrice !== 0;
    const statusColor = isPayingMore ? '#EF4444' : '#46C68E';
    const statusBg = isPayingMore ? '#FEF2F2' : '#F0FDF4';

    return (
      <View style={[premiumStyles.card, { 
        flexDirection: 'column', 
        alignItems: 'stretch', 
        borderColor: statusColor, 
        borderWidth: 1,
        backgroundColor: '#FFF'
      }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ backgroundColor: statusColor, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#FFF' }}>
                  {isPayingMore ? 'VALOR ACIMA' : 'MELHOR PREÇO'}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>
                • {formatDate(item.data_compra)}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1C2E', textTransform: 'capitalize', marginTop: 4 }}>
              {item.nome_item}
            </Text>
            
            {isPayingMore && (
              <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700', marginTop: 4 }}>
                ⚠️ Você está pagando R$ {(userPrice - item.preco).toFixed(2)} a mais por unidade.
              </Text>
            )}
          </View>
          
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[premiumStyles.priceText, { color: statusColor }]}>R$ {Number(item.preco).toFixed(2)}</Text>
            <Text style={{ fontSize: 9, color: '#94A3B8', fontWeight: 'bold' }}>NO MERCADO ABAIXO</Text>
          </View>
        </View>

        <View style={{ 
          marginTop: 12, 
          borderTopWidth: 1, 
          borderTopColor: '#F1F5F9', 
          paddingTop: 12,
          backgroundColor: statusBg,
          marginHorizontal: -15,
          marginBottom: -15,
          paddingHorizontal: 15,
          paddingBottom: 15,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16
        }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#1A1C2E' }}>
            📍 {item.mercados?.nome || 'Mercado desconhecido'}
          </Text>
          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 16 }}>
            {item.mercados?.endereco || 'Sem endereço cadastrado'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={premiumStyles.intelligenceContainer}>
      <View style={{ marginTop: 20, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <View style={{ backgroundColor: '#1A1C2E', padding: 8, borderRadius: 12 }}>
            <Text style={{ fontSize: 18 }}>🧠</Text>
          </View>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A1C2E', letterSpacing: -0.5 }}>
              Price Intelligence
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#46C68E' }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#46C68E', textTransform: 'uppercase' }}>
                Comparativo de Preços
              </Text>
            </View>
          </View>
        </View>
        
        <View style={{ 
          backgroundColor: '#F1F5F9', 
          padding: 12, 
          borderRadius: 15, 
          marginTop: 15, 
          borderLeftWidth: 4, 
          borderLeftColor: '#1A1C2E' 
        }}>
          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: 'bold', marginBottom: 2 }}>
            ANALISANDO LISTA
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1C2E' }}>
            "{currentList?.name}"
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#46C68E" size="large" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={report}
          keyExtractor={(item, index) => index.toString()}
          style={{ marginVertical: 10 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 50 }}>
              Nenhuma oferta encontrada para estes itens.
            </Text>
          }
          renderItem={renderItem}
        />
      )}

      <TouchableOpacity style={premiumStyles.backBtnPrimary} onPress={() => navigation.goBack()}>
        <Text style={premiumStyles.backBtnPrimaryText}>VOLTAR PARA LISTA</Text>
      </TouchableOpacity>
    </View>
  );
}