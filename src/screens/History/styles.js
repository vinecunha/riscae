import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    padding: 25,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: '#46C68E',
    fontWeight: '800',
    fontSize: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1C2E',
  },
  subtitle: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  clearButtonText: {
    color: '#FF7675',
    fontWeight: '700',
    fontSize: 10,
  },
  listContent: {
    padding: 20,
    paddingBottom: 150,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 20,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderLeftWidth: 6,
    borderLeftColor: '#46C68E',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1C2E',
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsCount: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#46C68E',
  },
  rightActionsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    width: 160,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 10,
  },
  duplicateButton: {
    backgroundColor: '#46C68E',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '95%',
    marginTop: 4,
    marginHorizontal: 5,
    borderRadius: 16
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '95%',
    marginTop: 4,
    marginHorizontal: 5,
    borderRadius: 16
  },
  actionText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 5,
  },
});