import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

function ArrowRight({ size = 26, color = '#fff' }) {
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
    case 0: // wide & flat — classic 3-puff
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.08, width: cw * 0.50, height: ch * 0.72, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.35, width: cw * 0.60, height: ch * 0.88, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw,         height: ch * 0.52, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 1: // tall single dome
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.20, width: cw * 0.60, height: ch * 1.00, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw * 0.50, height: ch * 0.60, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.52, width: cw * 0.48, height: ch * 0.55, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw,         height: ch * 0.40, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 2: // two humps — camel shape
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.04, width: cw * 0.40, height: ch * 0.95, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.48, width: cw * 0.46, height: ch * 0.80, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw,         height: ch * 0.45, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 3: // wide & fluffy — 4 puffs
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.00, width: cw * 0.38, height: ch * 0.65, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.25, width: cw * 0.42, height: ch * 0.90, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.55, width: cw * 0.38, height: ch * 0.70, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw,         height: ch * 0.42, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 4: // elongated wisp — very flat
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.10, width: cw * 0.35, height: ch * 0.80, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.38, width: cw * 0.55, height: ch * 0.65, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0,         width: cw * 1.10, height: ch * 0.38, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 5: // stacked triple — tall & narrow
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

const SLIDES = [
  {
    id: 0,
    senya: require('../assets/images/senya/senya_waving_flag.png'),
    title: 'Your gateway to Filipino Sign Language',
    body: 'SEÑAS is a learning platform that makes FSL accessible to everyone — students, teachers, and curious learners alike.',
  },
  {
    id: 1,
    senya: require('../assets/images/senya/senya_teaching.png'),
    title: 'Interactive lessons at your own pace',
    body: 'Work through structured modules on the FSL alphabet, greetings, numbers, and more. Each lesson builds on the last.',
  },
  {
    id: 2,
    senya: require('../assets/images/senya/senya_reflection.png'),
    title: 'Real-time hand sign recognition',
    body: 'Use your camera to practice hand signs. SEÑAS watches your gestures and gives you instant feedback on your form.',
  },
  {
    id: 3,
    senya: require('../assets/images/senya/senya_award.png'),
    title: 'Earn badges, level up, stay motivated',
    body: 'Track your XP, collect achievement badges, and maintain learning streaks. Celebrate every milestone on your FSL journey.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      router.replace('/role');
    } else {
      setCurrent(current + 1);
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
      {/* Drifting clouds — 6 different shapes, spread across top half */}
      <DriftingCloud top={height * 0.04} size={2.4} duration={28000} startX={0}            opacity={0.30} variant={0} />
      <DriftingCloud top={height * 0.10} size={2.0} duration={22000} startX={width * 0.50} opacity={0.25} variant={1} />
      <DriftingCloud top={height * 0.17} size={1.6} duration={19000} startX={width * 0.20} opacity={0.22} variant={2} />
      <DriftingCloud top={height * 0.24} size={2.2} duration={25000} startX={width * 0.70} opacity={0.20} variant={3} />
      <DriftingCloud top={height * 0.32} size={1.4} duration={17000} startX={width * 0.40} opacity={0.18} variant={4} />
      <DriftingCloud top={height * 0.40} size={1.8} duration={23000} startX={width * 0.10} opacity={0.15} variant={5} />

      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Image source={require('../assets/images/senya/senya_face.png')} style={styles.logo} contentFit="contain" />
          <Text style={styles.logoTitle}>SEÑAS</Text>
        </View>

        {/* Illustration with soft glow */}
        <View style={styles.imageWrap}>
          <View style={styles.glow} />
          <Image source={slide.senya} style={styles.senyaImage} contentFit="contain" />
        </View>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === current ? 24 : 8,
                  backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.3)',
                },
              ]}
            />
          ))}
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>

        {/* Navigation */}
        <View style={styles.navContainer}>
          {isLast ? (
            <Pressable style={styles.getStartedBtn} onPress={next}>
              <Text style={styles.getStartedText}>Get Started</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.skipBtn} onPress={() => router.replace('/role')}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              <Pressable style={styles.nextBtn} onPress={next}>
                <ArrowRight size={24} color="#fff" />
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 12,
  },
  logo: { width: 40, height: 40 },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  imageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: width * 0.80,
    height: width * 0.80,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  senyaImage: {
    width: width * 0.95,
    height: width * 0.95,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: { height: 8, borderRadius: 99 },
  textBlock: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoTitle: {
    fontSize: 26, fontWeight: '800', color: '#ffffff', letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: '#cfe0ff',
    lineHeight: 21,
    textAlign: 'center',
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 28,
    minHeight: 60,
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 4 },
  skipText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  nextBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});