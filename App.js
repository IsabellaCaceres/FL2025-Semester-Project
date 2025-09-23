import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, Pressable, ActivityIndicator } from 'react-native';
import { supabase } from './lib/supabase';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
      setLoading(false);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing info', 'Enter both email and password.');
      return;
    }
    if (__DEV__) {
      console.log('auth.submit', {
        emailLength: trimmedEmail.length,
        passwordLength: password.length,
      });
    }
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email: trimmedEmail, password });
    if (signUpError) {
      if (__DEV__) {
        console.log('auth.signup.error', signUpError);
      }
      const message = (signUpError.message || '').toLowerCase();
      if (
        signUpError.code === 'user_already_exists' ||
        message.includes('already') ||
        message.includes('exists')
      ) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (signInError) Alert.alert('Sign in error', signInError.message);
      } else {
        Alert.alert('Sign up error', signUpError.message);
      }
      setSubmitting(false);
      return;
    }
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (signInError) Alert.alert('Sign in error', signInError.message);
    }
    setSubmitting(false);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign out error', error.message);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Loading…</Text>
      ) : userEmail ? (
        <View style={styles.center}>
          <Text style={styles.hero}>Hello world!</Text>
          <Text style={styles.subtitle}>{userEmail}</Text>
          <View style={styles.spacer} />
          <Pressable style={styles.button} onPress={signOut} disabled={submitting}>
            <Text style={styles.buttonLabel}>Sign out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>Welcome</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#999"
          />
          <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonLabel}>Sign up</Text>
            )}
          </Pressable>
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  hero: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666' },
  form: { width: '80%', maxWidth: 420 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  spacer: { height: 12 },
  button: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonLabel: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonDisabled: { opacity: 0.4 },
});

