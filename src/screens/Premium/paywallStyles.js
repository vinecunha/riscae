import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 30 },
  content: { alignItems: 'center', paddingBottom: 40 },
  closeBtn: { alignSelf: 'flex-start', marginTop: 20 },
  emoji: { fontSize: 60, marginTop: 40 },
  title: { fontSize: 32, fontWeight: '900', color: '#1A1C2E', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 10 },
  benefits: { width: '100%', marginTop: 40, gap: 25 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  benefitEmoji: { fontSize: 24 },
  benefitTitle: { fontWeight: '800', color: '#1A1C2E' },
  benefitDesc: { color: '#94A3B8', fontSize: 12 },
  button: { 
    backgroundColor: '#46C68E', 
    width: '100%', 
    padding: 20, 
    borderRadius: 20, 
    marginTop: 50, 
    alignItems: 'center',
    shadowColor: "#46C68E",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5
  },
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  footerText: { marginTop: 15, color: '#CBD5E1', fontSize: 12 }
});