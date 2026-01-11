import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    padding: 25,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarEmoji: {
    fontSize: 35,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1C2E',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  metricsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardSmall: {
    width: (width / 2) - 30,
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardLarge: {
    backgroundColor: '#F1F5F9',
    width: '100%',
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  premiumBanner: {
    margin: 20,
    backgroundColor: '#46C68E',
    padding: 25,
    borderRadius: 24,
    shadowColor: "#46C68E",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  premiumTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  premiumSubtitle: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '900',
    marginBottom: 15,
    marginLeft: 5,
    letterSpacing: 1,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLabel: {
    fontWeight: '700',
    color: '#1A1C2E',
    fontSize: 14,
  },
  togglePlaceholder: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#46C68E',
  },
  chevron: {
    color: '#94A3B8',
    fontSize: 16,
  },
  logoutButton: {
    paddingVertical: 20,
    marginTop: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 13,
  },
});