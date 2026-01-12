import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Keyboard, 
  TouchableWithoutFeedback,
  Image
} from 'react-native';
import { sendMagicCode, verifyCode } from '../../services/authService';
import styles from './styles';

const DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'yahoo.com'];

export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('EMAIL');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleEmailChange = (text) => {
    setEmail(text);
    
    if (text.includes('@')) {
      const [localPart, domainPart] = text.split('@');
      const filtered = DOMAINS
        .filter(d => d.startsWith(domainPart))
        .map(d => `${localPart}@${d}`);
      
      setSuggestions(filtered.length > 0 && filtered[0] !== text ? filtered : []);
    } else {
      setSuggestions([]);
    }
  };

  const applySuggestion = (suggestion) => {
    setEmail(suggestion);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleSendEmail = async () => {
    if (!email.includes('@')) {
      Alert.alert("E-mail inválido", "Por favor, insira um e-mail válido.");
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    const { error } = await sendMagicCode(email.trim());
    setLoading(false);
    if (error) Alert.alert("Erro", error.message);
    else setStep('CODE');
  };

  const handleVerifyCode = async () => {
    Keyboard.dismiss();
    setLoading(true);
    const { session, error } = await verifyCode(email.trim(), code.trim());
    setLoading(false);
    if (error) Alert.alert("Código Inválido", "Verifique o número no seu e-mail.");
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ width: 120, height: 120, marginBottom: 20, alignSelf: 'center' }}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>Entrar no Riscaê</Text>
          
          {step === 'EMAIL' ? (
            <>
              <Text style={styles.subtitle}>Digite seu e-mail para receber um código de acesso.</Text>
              
              <View style={{ zIndex: 10, width: '100%' }}>
                <TextInput 
                  style={styles.input} 
                  placeholder="seu@email.com" 
                  value={email} 
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {suggestions.length > 0 && (
                  <View style={{
                    backgroundColor: '#FFF',
                    marginTop: -15,
                    marginBottom: 15,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    overflow: 'hidden',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}>
                    {suggestions.map((item) => (
                      <TouchableOpacity 
                        key={item} 
                        style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                        onPress={() => applySuggestion(item)}
                      >
                        <Text style={{ color: '#1A1C2E', fontWeight: '500' }}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.loginBtn, { marginTop: suggestions.length > 0 ? 0 : 10 }]} 
                onPress={handleSendEmail} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Enviar Código</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>Digite o código enviado para {email}</Text>
              <TextInput 
                style={styles.input} 
                placeholder="000000"
                value={code} 
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={8}
              />
              <TouchableOpacity style={styles.loginBtn} onPress={handleVerifyCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Confirmar Código</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('EMAIL')} style={{ marginTop: 20 }}>
                <Text style={styles.backButtonText}>Voltar para e-mail</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}