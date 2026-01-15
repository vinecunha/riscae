import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, ActivityIndicator, TextInput, TouchableWithoutFeedback } from 'react-native';
import styles from './styles';

export const MarketModal = ({ visible, loading, markets, sortType, onSort, onSelect, onClose }) => (
  <Modal visible={visible} animationType="fade" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={{...styles.modalTitle, fontSize: 16}}>📍 Mercados Por Perto (~5Km)</Text>
        
        <View style={styles.sortContainer}>
          <TouchableOpacity onPress={() => onSort('distance')} style={[styles.sortBtn, sortType === 'distance' && styles.sortBtnActive]}>
            <Text style={[styles.sortBtnText, sortType === 'distance' && styles.textWhite]}>DISTÂNCIA</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSort('az')} style={[styles.sortBtn, sortType === 'az' && styles.sortBtnActive]}>
            <Text style={[styles.sortBtnText, sortType === 'az' && styles.textWhite]}>A-Z</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color="#46C68E" size="large" /> : (
          <FlatList 
            data={markets} 
            keyExtractor={m => m.place_id} 
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onSelect(item)} style={styles.marketItem}>
                <View style={styles.marketItemHeader}>
                  <Text style={styles.marketItemName}>{item.name}</Text>
                  <Text style={styles.marketItemDist}>{item.distance.toFixed(1)}km</Text>
                </View>
                <Text style={styles.marketItemAddress} numberOfLines={1}>{item.address}</Text>
              </TouchableOpacity>
            )} 
          />
        )}
        <TouchableOpacity onPress={onClose} style={styles.closeModalBtn}><Text style={styles.closeModalText}>CANCELAR</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const SavingsModal = ({ visible, data, onConfirm, onCancel }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.savingsModalOverlay}>
      <View style={styles.savingsModalCard}>
        <View style={styles.savingsIconBox}><Text style={{ fontSize: 40 }}>💡</Text></View>
        <Text style={styles.savingsTitle}>Oportunidade de Economia!</Text>
        <View style={styles.savingsAmountBox}>
          <Text style={styles.savingsAmountLabel}>VOCÊ PODE ECONOMIZAR ATÉ</Text>
          <Text style={styles.savingsAmountValue}>R$ {data.total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity onPress={onConfirm} style={styles.segBtn}><Text style={styles.segBtnText}>SIM, SEPARAR E ECONOMIZAR</Text></TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.cancelSegBtn}><Text style={styles.cancelSegBtnText}>NÃO, FINALIZAR TUDO AQUI</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const EditModal = ({ visible, value, onChange, onSave, onClose }) => (
  <Modal visible={visible} animationType="fade" transparent>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback>
          <View style={styles.editModalCard}>
            <Text style={styles.editModalTitle}>Editar Nome</Text>
            <TextInput style={styles.editInput} value={value} onChangeText={onChange} autoFocus />
            <TouchableOpacity style={styles.saveBtn} onPress={onSave}><Text style={styles.saveBtnText}>SALVAR</Text></TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);