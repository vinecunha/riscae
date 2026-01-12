import { supabase } from './supabase';

export const sendMagicCode = async (email) => {
  // Remova o emailRedirectTo daqui para que ele foque no Token
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
  });
  return { data, error };
};

export const verifyCode = async (email, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(), // Os 6 dígitos do e-mail
    type: 'magiclink',   // Mantenha como magiclink para OTP de e-mail
  });
  
  return { session: data.session, error };
};