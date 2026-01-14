import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './receiptStyles';

export default function Receipt({ route, navigation }) {
  const { purchase } = route.params;

  // Garantimos que a lista de itens venha do campo 'items' salvo no Store
  const receiptItems = purchase.items || [];

  const Divider = () => (
    <Text style={{ color: '#94A3B8', fontSize: 10, textAlign: 'center', letterSpacing: -1 }} numberOfLines={1}>
      ----------------------------------------------------------------------
    </Text>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F1F5F9' }]} edges={['top']}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← VOLTAR AO HISTÓRICO</Text>
        </TouchableOpacity>

        <View style={[
          styles.receiptContainer, 
          { 
            backgroundColor: '#FFFBEB', 
            padding: 20,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            marginHorizontal: 10,
          }
        ]}>
          {/* Topo do Cupom */}
          <View style={styles.header}>
            <Text style={[styles.brand, { color: '#475569', letterSpacing: 2, textAlign: 'center' }]}>RISCAÊ</Text>
            <Text style={[styles.subtitle, { color: '#64748B', fontWeight: 'bold', textAlign: 'center', fontSize: 8 }]}>RESUMO DE COMPRA (NÃO SUBSTITUI SEU CUPOM FISCAL)</Text>
            
            <View style={{ marginVertical: 5 }}>
              <Divider />
            </View>
            
            <Text style={[styles.details, { color: '#334155', fontSize: 11 }]}>MERCADO: {purchase.market?.toUpperCase() || 'NÃO INFORMADO'}</Text>
            <Text style={[styles.details, { color: '#334155', fontSize: 11 }]}>LISTA: {purchase.listName?.toUpperCase()}</Text>
            <Text style={[styles.details, { color: '#334155', fontSize: 11 }]}>DATA: {purchase.date}</Text>
            
            <View style={{ marginVertical: 5 }}>
              <Divider />
            </View>
          </View>

          <FlatList
            data={receiptItems}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <Divider />}
            renderItem={({ item }) => (
              <View style={[styles.itemRow, { paddingVertical: 5 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: '#1E293B', fontWeight: '700', fontSize: 13 }]}>{item.name.toUpperCase()}</Text>
                  <Text style={[styles.itemSub, { color: '#64748B', fontSize: 11, marginTop: 2 }]}>
                    {item.amount} {item.unitType === 'UNIT' || item.unitType === 'UN' ? 'UN' : 'KG'} x R$ {item.price.toFixed(2)}
                  </Text>
                </View>
                <Text style={[styles.itemTotal, { color: '#1E293B', fontWeight: 'bold', fontSize: 14 }]}>R$ {(item.amount * item.price).toFixed(2)}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#94A3B8', fontStyle: 'italic', fontSize: 12 }}>
                Nenhum item detalhado neste cupom.
              </Text>
            }
          />

          {/* Rodapé do Cupom */}
          <View style={styles.footer}>
            <View style={{ marginTop: 10 }}>
              <Divider />
            </View>
            
            <View style={[styles.totalRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 }]}>
              <Text style={[styles.totalLabel, { color: '#1E293B', fontSize: 16, fontWeight: '900' }]}>TOTAL PAGO</Text>
              <Text style={[styles.totalValue, { color: '#1E293B', fontSize: 22, fontWeight: '900' }]}>R$ {purchase.total?.toFixed(2) || "0.00"}</Text>
            </View>

            <Divider />
            
            <Text style={[styles.thanks, { color: '#64748B', textAlign: 'center', fontSize: 10, fontWeight: 'bold', marginTop: 15, lineHeight: 14 }]}>
              COMPRA FINALIZADA COM SUCESSO NO RISCAÊ{"\n"}OBRIGADO PELA PREFERÊNCIA!
            </Text>
            
            <View style={{ marginTop: 15, opacity: 0.3 }}>
              <Divider />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}