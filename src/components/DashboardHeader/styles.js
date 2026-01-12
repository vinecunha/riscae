import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    paddingBottom: 10 
  },
  logo: { width: 90, height: 35 },
  badge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginTop: 5,
    alignSelf: 'flex-start'
  },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#555' },
  actions: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 5, 
    elevation: 2, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  importBtn: { 
    backgroundColor: '#1A1C2E', 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 5 
  },
  importIcon: { fontSize: 16, color: '#FFF' }
});