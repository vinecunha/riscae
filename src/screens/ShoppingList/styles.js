import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  backBtn: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.secondary,
  },
  inputArea: {
    padding: 20,
    marginTop: 10,
  },
  mainInput: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 20,
    fontSize: 16,
    color: colors.text,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtn: {
    backgroundColor: colors.primary,
  },
  weightBtn: {
    backgroundColor: colors.secondary,
  },
  btnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    marginTop: 50,
    fontSize: 16,
  }
});