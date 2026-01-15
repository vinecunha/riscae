import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 10 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  headerActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  backText: { fontSize: 14, color: '#1A1C2E', fontWeight: '600' },
  
  // Botões de Modo e Mercado
  modeButton: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, height: 32, borderRadius: 8, justifyContent: 'center' },
  modeButtonActive: { backgroundColor: '#1A1C2E' },
  modeButtonText: { color: '#1A1C2E', fontSize: 8, fontWeight: '900' },
  marketSelector: { backgroundColor: '#1A1C2E', paddingHorizontal: 8, height: 32, borderRadius: 8, maxWidth: 100, justifyContent: 'center' },
  marketSelectorActive: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#46C68E' },
  marketSelectorText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  
  // Info da Lista
  headerInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  listLabel: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold' },
  listName: { fontSize: 22, fontWeight: '900', color: '#1A1C2E' },
  editBtn: { fontSize: 10, color: '#46C68E', fontWeight: '900' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#1A1C2E' },

  // Input Area
  inputContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 6, alignItems: 'center' },
  input: { flex: 1, height: 50, paddingHorizontal: 10, fontSize: 16, fontWeight: '600' },
  unitBtn: { backgroundColor: '#1A1C2E', paddingHorizontal: 12, height: 44, borderRadius: 12, justifyContent: 'center' },
  unitBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  addBtn: { backgroundColor: '#1A1C2E', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFF', fontSize: 24 },

  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 28, 46, 0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 30, padding: 25, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1A1C2E', marginBottom: 20 },
  
  // Itens do Mercado (ONDE O ENDEREÇO APARECE)
  marketItem: { padding: 18, backgroundColor: '#F8FAFC', borderRadius: 15, marginBottom: 10 },
  marketItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  marketItemName: { fontWeight: '800', color: '#1A1C2E', flex: 1 },
  marketItemDist: { fontSize: 10, color: '#46C68E', fontWeight: '900' },
  marketItemAddress: { fontSize: 11, color: '#94A3B8' },

  // Filtros no Modal
  sortContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  sortBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  sortBtnActive: { backgroundColor: '#1A1C2E' },
  sortBtnText: { fontSize: 10, fontWeight: '900', color: '#1A1C2E' },

  // Utilitários
  textWhite: { color: '#FFF' },
  textGreen: { color: '#46C68E' },
  closeModalBtn: { marginTop: 20, alignItems: 'center' },
  closeModalText: { color: '#94A3B8', fontWeight: '700' },

  // Banner de Economia
  savingsBanner: { marginHorizontal: 20, marginBottom: 15, backgroundColor: '#F0FDF4', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#46C68E', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  savingsLabel: { fontSize: 10, color: '#166534', fontWeight: 'bold' },
  savingsValue: { fontSize: 18, fontWeight: '900', color: '#14532D' },
  
  // Finalização
  footerAction: { padding: 20, backgroundColor: '#FFF' },
  finalizeBtn: { backgroundColor: '#46C68E', padding: 18, borderRadius: 20, alignItems: 'center' },
  finalizeBtnText: { color: '#FFF', fontWeight: '900' },
});