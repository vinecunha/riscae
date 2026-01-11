import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  header: { marginTop: 40, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary },
  summaryCard: { 
    backgroundColor: colors.surface, padding: 25, borderRadius: 32, 
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, marginBottom: 30
  },
  label: { fontSize: 13, color: colors.textLight, fontWeight: '600', textTransform: 'uppercase' },
  totalValue: { fontSize: 36, fontWeight: '900', color: colors.primary, marginTop: 5 },
  listCard: { 
    backgroundColor: colors.surface, padding: 20, borderRadius: 24, 
    marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  listName: { fontSize: 18, fontWeight: '700', color: colors.secondary },
  listValue: { fontSize: 16, fontWeight: '600', color: colors.secondary },
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 120, // Aumentado de ~30 para 120 para subir o botão
    backgroundColor: '#1A1C2E',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    }
});