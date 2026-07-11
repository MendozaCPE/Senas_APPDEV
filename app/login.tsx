import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

// ── SVG ICONS ─────────────────────────────────────
function IdCard({ size = 18, color = "currentColor" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="M8 10h8" />
      <Path d="M8 14h5" />
      <Circle cx="16" cy="14" r="2" />
    </Svg>
  );
}

function Lock({ size = 18, color = "currentColor" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <Rect x="3" y="11" width="18" height="10" rx="2" />
      <Path d="M7 11V8a5 5 0 0 1 10 0v3" />
    </Svg>
  );
}

function GraduationCap({ size = 20, color = "currentColor" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <Path d="M12 2L1 7l11 5 9-4.09V17" />
      <Path d="M21 7v6" />
      <Path d="M7 21h10" />
    </Svg>
  );
}

function ArrowRight({ size = 26, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14" />
      <Path d="M13 5l7 7-7 7" />
    </Svg>
  );
}

// ── SIMPLE ANIMATED CLOUD ─────────────────────────────────────
// Plain rounded-View "puff" shapes rather than detailed SVG gradients,
// so it stays subtle. Each cloud drifts slowly left-to-right and loops.
function DriftingCloud({ top, size = 1, duration = 22000, delay = 0, opacity = 0.5 }: {
  top: number;
  size?: number;
  duration?: number;
  delay?: number;
  opacity?: number;
}) {
  const translateX = useRef(new Animated.Value(-width * 0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: width + width * 0.4,
          duration,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -width * 0.4,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const cloudWidth = 90 * size;
  const cloudHeight = 34 * size;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        opacity,
        transform: [{ translateX }],
      }}
    >
      <View style={{ width: cloudWidth, height: cloudHeight, justifyContent: 'flex-end' }}>
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: cloudWidth * 0.12,
          width: cloudWidth * 0.55,
          height: cloudHeight * 0.75,
          borderRadius: 999,
          backgroundColor: '#ffffff',
        }} />
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: cloudWidth * 0.38,
          width: cloudWidth * 0.62,
          height: cloudHeight * 0.9,
          borderRadius: 999,
          backgroundColor: '#ffffff',
        }} />
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: cloudWidth,
          height: cloudHeight * 0.55,
          borderRadius: 999,
          backgroundColor: '#ffffff',
        }} />
      </View>
    </Animated.View>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  type,
  icon,
  maxLength,
  error,
  onBlur,
}: any) {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const showError = touched && error;

  return (
    <View style={styles.fieldContainer}>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        showError && styles.inputWrapperError
      ]}>
        <View style={styles.inputIcon}>
          {icon}
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9AABB8"
          secureTextEntry={type === 'password'}
          keyboardType="number-pad"
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setTouched(true);
            if (onBlur) onBlur();
          }}
        />
      </View>
      {showError && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const [lrn, setLrn] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [lrnError, setLrnError] = useState('');
  const [pinError, setPinError] = useState('');
  const pinInputRef = useRef(null);

  const validateLRN = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setLrn(numericText);

    if (numericText.length > 0 && numericText.length < 12) {
      setLrnError(`LRN must be exactly 12 digits (${numericText.length}/12)`);
    } else {
      setLrnError('');
    }
  };

  const validatePIN = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setPw(numericText);

    if (numericText.length > 0 && numericText.length < 4) {
      setPinError(`PIN must be exactly 4 digits (${numericText.length}/4)`);
    } else {
      setPinError('');
    }
  };

  const handleSignIn = async () => {
    let hasError = false;

    if (lrn.length !== 12) {
      setLrnError('LRN must be exactly 12 digits');
      hasError = true;
    }

    if (pw.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.login(lrn, pw);

      if (response.user) {
        Alert.alert(
          '✅ Login Successful!',
          `Welcome back, ${response.user.student?.first_name || response.user.name || 'Student'}!`,
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/assessment'),
            },
          ]
        );
      }
    } catch (error: any) {
      let errorMessage = 'Invalid LRN or PIN. Please try again.';

      if (error.message === 'Student not found') {
        errorMessage = '❌ Student not found. Please check your LRN.';
      } else if (error.message === 'Invalid PIN') {
        errorMessage = '❌ Incorrect PIN. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage = '📡 Network error. Please check your connection.';
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* A few slow, subtle drifting clouds — kept minimal on purpose */}
      <DriftingCloud top={height * 0.10} size={1.1} duration={26000} delay={0} opacity={0.35} />
      <DriftingCloud top={height * 0.18} size={0.75} duration={20000} delay={4000} opacity={0.25} />
      <DriftingCloud top={height * 0.06} size={0.6} duration={17000} delay={9000} opacity={0.2} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header — mascot beside SEÑAS, no card, no wrapper */}
              <View style={styles.header}>
                <Image source={require('../assets/images/senya/senya_face.png')} style={styles.logo} contentFit="contain" />
                <Text style={styles.title}>SEÑAS</Text>
              </View>

              {/* Fields — plain, no card container, sit right on the gradient */}
              <View style={styles.content}>
                {/* Need your LRN? note */}
                <View style={styles.noteCard}>
                  <View style={styles.noteTextContent}>
                    <Text style={styles.noteTitle}>Need your LRN?</Text>
                    <Text style={styles.noteDesc}>Your Learner Reference Number (LRN) is provided by your teacher. Ask them if you need help!</Text>
                  </View>
                </View>

                <Field
                  value={lrn}
                  onChange={validateLRN}
                  placeholder="Enter your 12-digit LRN"
                  type="text"
                  icon={<IdCard size={18} color="#9AABB8" />}
                  maxLength={12}
                  error={lrnError}
                />

                <Field
                  value={pw}
                  onChange={validatePIN}
                  placeholder="Enter your 4-digit PIN"
                  type="password"
                  icon={<Lock size={18} color="#9AABB8" />}
                  maxLength={4}
                  error={pinError}
                />

                <Pressable style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot PIN? Ask your teacher!</Text>
                </Pressable>

                {/* Circular arrow submit button */}
                <Pressable
                  style={[
                    styles.signInBtn,
                    (loading || lrn.length !== 12 || pw.length !== 4) && styles.signInBtnDisabled,
                  ]}
                  onPress={handleSignIn}
                  disabled={loading || lrn.length !== 12 || pw.length !== 4}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ArrowRight size={26} color="#fff" />
                  )}
                </Pressable>

                <Text style={styles.footerText}>
                  By signing in, you agree to our <Text style={styles.linkText}>Terms</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>

                {/* Spacer so form content doesn't sit under the bottom image */}
                <View style={{ height: width * 0.45 }} />
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Bottom illustration — pinned to the screen edge, outside the scroll.
          Swap this require() for your provided image. */}
      <View style={styles.bottomImageContainer} pointerEvents="none">
        <Image
          source={require('../assets/images/senya/bottom_illustration.png')}
          style={styles.bottomImage}
          contentFit="contain"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: height * 0.08,
    paddingBottom: height * 0.05,
  },
  logo: { width: 40, height: 40 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  content: { paddingHorizontal: 32, alignItems: 'center' },
  noteCard: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    borderColor: 'transparent',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteIconBox: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 40, padding: 8 },
  noteTextContent: { flex: 1 },
  noteTitle: { fontSize: 13, fontWeight: '600', color: '#ffe1a8' },
  noteDesc: { fontSize: 12, color: '#e6edf7', lineHeight: 16, marginTop: 4 },
  fieldContainer: { width: '100%', marginBottom: 16 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 18,
    minHeight: 52,
  },
  inputWrapperFocused: {
    backgroundColor: '#ffffff',
  },
  inputWrapperError: { borderWidth: 1.5, borderColor: '#E53935' },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A2C3E',
  },
  errorText: {
    fontSize: 12,
    color: '#ffd7d7',
    marginTop: 6,
    marginLeft: 8,
    fontWeight: '500',
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 2, marginBottom: 6 },
  forgotText: { color: '#cfe0ff', fontSize: 12, fontWeight: '600' },
  signInBtn: {
    marginTop: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtnDisabled: {
    opacity: 0.4,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 80,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  linkText: { color: '#cfe0ff', fontWeight: '600' },
  bottomImageContainer: {
    position: 'absolute',
    bottom: -height * 0.0001,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 0,
    overflow: 'visible',   // allow the image to spill past screen edges
  },
  bottomImage: {
    width: width * 1.25,     // wider than the screen — was `width`
    height: width * 0.70,   // scale height to match (keep same ratio as before: 0.6/1 → 0.78/1.3)
    alignSelf: 'center',
  },
});