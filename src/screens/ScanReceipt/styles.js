import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    justifyContent: 'center' 
  },
  overlay: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  focusFrame: { 
    width: 260, 
    height: 260, 
    borderWidth: 2, 
    borderColor: '#46C68E', 
    borderRadius: 30, 
    marginBottom: 20 
  },
  scanText: { 
    color: '#FFF', 
    fontWeight: '800', 
    fontSize: 14, 
    marginBottom: 20 
  },
  cancelBtn: { 
    position: 'absolute', 
    bottom: 50, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 20 
  },
  cancelText: { 
    color: '#FFF', 
    fontWeight: '900' 
  }
});