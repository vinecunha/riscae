import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    padding: 20,
    flex: 1,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#46C68E',
    fontWeight: '800',
    fontSize: 12,
  },
  receiptContainer: {
    backgroundColor: '#FFF',
    flex: 1,
    borderRadius: 4,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brand: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1C2E',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 15,
  },
  dashedLine: {
    height: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 15,
  },
  details: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1C2E',
  },
  itemSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1C2E',
  },
  footer: {
    marginTop: 'auto',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A1C2E',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#46C68E',
  },
  thanks: {
    textAlign: 'center',
    fontSize: 9,
    color: '#CBD5E1',
    fontWeight: '800',
    marginTop: 15,
  },
});