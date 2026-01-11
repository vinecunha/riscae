import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useCartStore } from '../../store/cartStore';
import Footer from '../../components/Footer';
import styles from './styles';

export default function History({ navigation }) {
  const { history = [], clearHistory, deleteHistoryEntry, duplicateFromHistory } = useCartStore();

  const onSwipeOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderRightActions = (item) => (
    <View style={styles.rightActionsContainer}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.duplicateButton]}
        onPress={() => {
          duplicateFromHistory(item.id);
          Alert.alert("Sucesso", "Lista duplicada para o seu Dashboard!");
        }}
      >
        <Text style={{ fontSize: 20 }}>🔄</Text>
        <Text style={styles.actionText}>REPETIR</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => {
          Alert.alert(
            "Apagar Registro", 
            "Deseja remover esta compra do histórico?",
            [
              { text: "Cancelar", style: "cancel" },
              { 
                text: "Apagar", 
                onPress: () => deleteHistoryEntry(item.id), 
                style: "destructive" 
              }
            ]
          );
        }}
      >
        <Text style={{ fontSize: 20 }}>🗑️</Text>
        <Text style={styles.actionText}>APAGAR</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← VOLTAR PARA O INÍCIO</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Histórico</Text>
              <Text style={styles.subtitle}>Suas compras finalizadas</Text>
            </View>
            {history && history.length > 0 && (
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearButtonText}>LIMPAR TUDO</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList 
          data={history}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity 
              onPress={() => navigation.navigate('Backup')}
              style={{ 
                backgroundColor: '#1A1C2E', 
                padding: 15, 
                borderRadius: 15, 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: 20
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 12 }}>☁️</Text>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Sincronizar Histórico</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }} numberOfLines={1}>Proteja seus dados na nuvem</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(70, 198, 142, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: '#46C68E', fontWeight: '900', fontSize: 9 }}>VER BACKUP</Text>
              </View>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyText}>
                Nenhuma compra finalizada ainda.{"\n"}Suas listas concluídas aparecerão aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Swipeable 
              renderRightActions={() => renderRightActions(item)} 
              overshootRight={false}
              onSwipeableWillOpen={onSwipeOpen}
            >
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Receipt', { purchase: item })}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.listName}>{item.listName}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>VER CUPOM</Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.itemsCount}>
                      {item.completedCount} de {item.itemsCount} itens riscados
                    </Text>
                  </View>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>TOTAL GASTO</Text>
                    <Text style={styles.totalValue}>R$ {item.total?.toFixed(2) || "0.00"}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Swipeable>
          )}
        />
        <Footer />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}