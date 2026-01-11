import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './receiptStyles';

export default function Receipt({ route, navigation }) {
  const { purchase } = route.params;

  // Garantimos que a lista de itens venha do campo 'items' salvo no Store
  const receiptItems = purchase.items || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← VOLTAR AO HISTÓRICO</Text>
        </TouchableOpacity>

        <View style={styles.receiptContainer}>
          <View style={styles.header}>
            <Text style={styles.brand}>RISCAÊ</Text>
            <Text style={styles.subtitle}>RESUMO DE COMPRA</Text>
            <View style={styles.dashedLine} />
            <Text style={styles.details}>MERCADO: {purchase.market?.toUpperCase() || 'NÃO INFORMADO'}</Text>
            <Text style={styles.details}>LISTA: {purchase.listName?.toUpperCase()}</Text>
            <Text style={styles.details}>DATA: {purchase.date}</Text>
            <View style={styles.dashedLine} />
          </View>

          <FlatList
            data={receiptItems}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name.toUpperCase()}</Text>
                  <Text style={styles.itemSub}>
                    {item.amount} {item.unitType === 'UNIT' || item.unitType === 'UN' ? 'UN' : 'KG'} x R$ {item.price.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>R$ {(item.amount * item.price).toFixed(2)}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#94A3B8' }}>
                Nenhum item detalhado neste cupom.
              </Text>
            }
          />

          <View style={styles.footer}>
            <View style={styles.dashedLine} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL PAGO</Text>
              <Text style={styles.totalValue}>R$ {purchase.total?.toFixed(2) || "0.00"}</Text>
            </View>
            <View style={styles.dashedLine} />
            <Text style={styles.thanks}>COMPRA FINALIZADA COM SUCESSO</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}