import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 25 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1A1C2E', marginTop: 30 },
  subtitle: { color: '#64748B', marginBottom: 30 },
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
  marketName: { fontWeight: '800', color: '#1A1C2E', fontSize: 16 },
  count: { fontSize: 12, color: '#94A3B8' },
  price: { fontSize: 18, fontWeight: '900', color: '#46C68E' },
  backBtn: { backgroundColor: '#1A1C2E', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  backBtnText: { color: '#FFF', fontWeight: '900' }
});