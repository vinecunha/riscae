import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  itemComparisonContainer: {
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 15,
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#46C68E',
  },
  badgeText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '600',
  },
  bold: {
    fontWeight: '900',
  },
  lockedContainer: {
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 15,
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  lockedText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '800',
  },
  intelligenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1C2E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
    maxWidth: 100,
  },
  intelligenceBtnText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
  },
  // Estilos extras para Paywall e Intelligence
  paywallContainer: { flex: 1, backgroundColor: '#FFF', padding: 30 },
  intelligenceContainer: { flex: 1, backgroundColor: '#F8FAFC', padding: 25 },
  card: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  marketName: { fontWeight: '800', color: '#1A1C2E', fontSize: 16, flex: 1 },
  priceText: { fontSize: 18, fontWeight: '900', color: '#46C68E' },
  backBtnPrimary: { backgroundColor: '#1A1C2E', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  backBtnPrimaryText: { color: '#FFF', fontWeight: '900' }
});