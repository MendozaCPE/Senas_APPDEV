import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Linking, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { GhostButton } from '../components/ui/Buttons';

const { width, height } = Dimensions.get('window');
const ACCENT = '#2563EB';

function ArrowRight({ size = 24, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14" />
      <Path d="M13 5l7 7-7 7" />
    </Svg>
  );
}

// ── Cloud shape variants ───────────────────────────────────────────────
function CloudPuffs({ cw, ch, variant }: { cw: number; ch: number; variant: number }) {
  const w = '#ffffff';
  switch (variant % 6) {
    case 0:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.08, width: cw * 0.50, height: ch * 0.72, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.35, width: cw * 0.60, height: ch * 0.88, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw,         height: ch * 0.52, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 1:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.20, width: cw * 0.60, height: ch * 1.00, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw * 0.50, height: ch * 0.60, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.52, width: cw * 0.48, height: ch * 0.55, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw,         height: ch * 0.40, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 2:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.04, width: cw * 0.40, height: ch * 0.95, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.48, width: cw * 0.46, height: ch * 0.80, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw,         height: ch * 0.45, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 3:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.00, width: cw * 0.38, height: ch * 0.65, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.25, width: cw * 0.42, height: ch * 0.90, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.55, width: cw * 0.38, height: ch * 0.70, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw,         height: ch * 0.42, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 4:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.10, width: cw * 0.35, height: ch * 0.80, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.38, width: cw * 0.55, height: ch * 0.65, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw * 1.10, height: ch * 0.38, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 5:
    default:
      return (
        <>
          <View style={{ position: 'absolute', bottom: ch * 0.45, left: cw * 0.30, width: cw * 0.40, height: ch * 0.55, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: ch * 0.20, left: cw * 0.12, width: cw * 0.65, height: ch * 0.55, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0,         left: 0,         width: cw,         height: ch * 0.45, borderRadius: 999, backgroundColor: w }} />
        </>
      );
  }
}

// ── Drifting Cloud ─────────────────────────────────────────────────────
function DriftingCloud({ top, size = 1, duration = 22000, startX = 0, opacity = 0.5, variant = 0 }: {
  top: number; size?: number; duration?: number; startX?: number; opacity?: number; variant?: number;
}) {
  const totalTravel = width + width * 0.5;
  const initialX = -width * 0.5 + (startX % totalTravel);
  const translateX = useRef(new Animated.Value(initialX)).current;

  useEffect(() => {
    const remaining = totalTravel - (initialX + width * 0.5);
    const firstDuration = Math.max((remaining / totalTravel) * duration, 100);

    Animated.timing(translateX, {
      toValue: width + width * 0.5,
      duration: firstDuration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(-width * 0.5);
      Animated.loop(
        Animated.timing(translateX, {
          toValue: width + width * 0.5,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });

    return () => translateX.stopAnimation();
  }, []);

  const cw = 90 * size;
  const ch = 34 * size;

  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top, left: 0, opacity, transform: [{ translateX }] }}>
      <View style={{ width: cw, height: ch * 1.1 }}>
        <CloudPuffs cw={cw} ch={ch} variant={variant} />
      </View>
    </Animated.View>
  );
}

export default function RoleSelect() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const pickRole = (role: string) => {
    setSelected(role);
  };

  const confirmRole = () => {
    if (!selected) return;
    if (selected === 'teacher') {
      setShowPopup(true);
      return;
    }
    router.replace('/login');
  };

  return (
    <LinearGradient
      colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Drifting clouds — same motif as splash/login/onboarding */}
      <DriftingCloud top={height * 0.04} size={2.4} duration={28000} startX={0}            opacity={0.30} variant={0} />
      <DriftingCloud top={height * 0.10} size={2.0} duration={22000} startX={width * 0.50} opacity={0.25} variant={1} />
      <DriftingCloud top={height * 0.17} size={1.6} duration={19000} startX={width * 0.20} opacity={0.22} variant={2} />
      <DriftingCloud top={height * 0.24} size={2.2} duration={25000} startX={width * 0.70} opacity={0.20} variant={3} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.topBar}>
            <Text style={styles.title}>Select your role.</Text>
          </View>
          <Text style={styles.subtitle}>We'll tailor your experience based on your role.</Text>

          {/* Cards */}
          <View style={styles.cardsContainer}>
            {/* STUDENT CARD */}
            <Pressable
              style={[styles.roleCard, selected === 'student' && styles.roleCardSelected]}
              onPress={() => pickRole('student')}
            >
              <View style={styles.cardTextContent}>
                <Text style={styles.cardLabel}>STUDENT</Text>
                <Text style={styles.cardTitle}>I'm here to learn</Text>
              </View>
              <View style={styles.avatarBox}>
                <Image source={require('../assets/images/senya/senya_student.png')} style={styles.avatarImage} contentFit="contain" />
              </View>
            </Pressable>

            {/* TEACHER CARD */}
            <Pressable
              style={[styles.roleCard, selected === 'teacher' && styles.roleCardSelected]}
              onPress={() => pickRole('teacher')}
            >
              <View style={styles.cardTextContent}>
                <Text style={styles.cardLabel}>TEACHER</Text>
                <Text style={styles.cardTitle}>I'm here to teach</Text>
              </View>
              <View style={styles.avatarBox}>
                <Image source={require('../assets/images/senya/senya_teacher.png')} style={styles.avatarImage} contentFit="contain" />
              </View>
            </Pressable>
          </View>

          {/* Continue button */}
          <View style={styles.navContainer}>
            <Pressable
              style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
              onPress={confirmRole}
              disabled={!selected}
            >
              <ArrowRight size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Teacher Popup Modal */}
      <Modal visible={showPopup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Image source={require('../assets/images/senya/senya_teacher.png')} style={styles.modalLogo} contentFit="contain" />
            <Text style={styles.modalTitle}>You're heading to the teacher portal!</Text>
            <Text style={styles.modalDesc}>
              The SEÑAS teacher dashboard is a web-based platform. You'll be redirected to log in and manage your classes.
            </Text>
            <View style={styles.modalUrlBox}>
              <Text style={styles.modalUrlText}>teacher.senas.edu.ph</Text>
            </View>
            <View style={styles.modalActions}>
              <GhostButton style={styles.modalBtn} title="← Back" onPress={() => { setShowPopup(false); setSelected(null); }} />
              <Pressable style={styles.modalPrimaryBtn} onPress={() => { Linking.openURL('https://teacher.senas.edu.ph'); setShowPopup(false); setSelected(null); }}>
                <Text style={styles.modalPrimaryBtnText}>Open Dashboard →</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 28 },
  step: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  subtitle: { fontSize: 13.5, color: '#cfe0ff', fontWeight: '500', lineHeight: 20, marginBottom: 28 },

  cardsContainer: { gap: 16 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  roleCardSelected: {
    borderColor: ACCENT,
    backgroundColor: '#ffffff',
  },
  cardTextContent: { flex: 1, paddingRight: 12 },
  cardLabel: { fontSize: 11, fontWeight: '800', color: '#9AABB8', letterSpacing: 0.8, marginBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0f3172' },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15
  },
  avatarImage: { width: 95, height: 95 },

  navContainer: { alignItems: 'center', marginTop: 36 },
  nextBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: { opacity: 0.35 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,30,80,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 99, backgroundColor: '#E5E7EB', marginBottom: 20 },
  modalLogo: { width: 80, height: 80, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f3172', textAlign: 'center', marginBottom: 8 },
  modalDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  modalUrlBox: {
    backgroundColor: 'rgba(5,150,105,0.06)',
    borderColor: 'rgba(5,150,105,0.15)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalUrlText: { fontSize: 13, fontWeight: '600', color: '#047857' },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 12 },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});