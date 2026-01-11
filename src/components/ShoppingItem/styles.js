import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  card: { 
    backgroundColor: colors.surface, 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1
  },
  completed: { opacity: 0.6, backgroundColor: '#FAFAFA' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { 
    flex: 1, 
    backgroundColor: colors.background, 
    padding: 10, 
    borderRadius: 12, 
    fontSize: 14,
    color: colors.text 
  },
  actionBtn: { 
    backgroundColor: colors.primary, 
    paddingHorizontal: 15, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center'
  },
  donePrice: { fontSize: 16, fontWeight: '700', color: colors.success }
});