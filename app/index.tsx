import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

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

export default function SplashScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const textOpacity     = useRef(new Animated.Value(0)).current;
  const textTranslateY  = useRef(new Animated.Value(20)).current;
  const taglineOpacity  = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(12)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(12)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const mascotOpacity   = useRef(new Animated.Value(0)).current;
  const mascotTranslateY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    const t1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity,    { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 700);

    const t2 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity,    { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 1500);

    const t3 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(headerTranslateY,  { toValue: -height * 0.14, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(subtitleOpacity,   { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(subtitleTranslateY,{ toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(mascotOpacity,     { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(mascotTranslateY,  { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => setReady(true));
    }, 2800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const goToOnboarding = () => { if (ready) router.replace('/onboarding'); };

  return (
    <Pressable style={{ flex: 1 }} onPress={goToOnboarding}>
      <LinearGradient
        colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Drifting clouds — 6 different shapes, spread across top half */}
        <DriftingCloud top={height * 0.04} size={2.4} duration={28000} startX={0}             opacity={0.30} variant={0} />
        <DriftingCloud top={height * 0.10} size={2.0} duration={22000} startX={width * 0.50}  opacity={0.25} variant={1} />
        <DriftingCloud top={height * 0.17} size={1.6} duration={19000} startX={width * 0.20}  opacity={0.22} variant={2} />
        <DriftingCloud top={height * 0.24} size={2.2} duration={25000} startX={width * 0.70}  opacity={0.20} variant={3} />
        <DriftingCloud top={height * 0.32} size={1.4} duration={17000} startX={width * 0.40}  opacity={0.18} variant={4} />
        <DriftingCloud top={height * 0.40} size={1.8} duration={23000} startX={width * 0.10}  opacity={0.15} variant={5} />

        {/* Title + Tagline + Subtitle */}
        <Animated.View style={{ transform: [{ translateY: headerTranslateY }], alignItems: 'center' }}>
          <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }], flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={require('../assets/images/senya/senya_face.png')} style={styles.logo} contentFit="contain" />
            <Text style={styles.title}>SEÑAS</Text>
          </Animated.View>

          <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }], alignItems: 'center', marginTop: 16 }}>
            <Text style={styles.tagline}>Learn · Practice · Connect</Text>
          </Animated.View>

          <Animated.View style={{ opacity: subtitleOpacity, transform: [{ translateY: subtitleTranslateY }], alignItems: 'center', marginTop: 12 }}>
            <Text style={styles.subtitle}>Your guide onto learning Filipino Sign Language</Text>
          </Animated.View>
        </Animated.View>

        {/* Mascot */}
        <Animated.View style={[styles.mascotContainer, { opacity: mascotOpacity, transform: [{ translateY: mascotTranslateY }] }]}>
          <Image source={require('../assets/images/senya/intro_senya.png')} style={styles.firstSlideMascot} contentFit="contain" />
        </Animated.View>

      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  title: {
    fontSize: 50, fontWeight: '800', color: '#ffffff', letterSpacing: 1,
  },
  logo: { width: 50, height: 50 },
  tagline: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '500', lineHeight: 22 },
  subtitle: { color: '#cfe0ff', fontSize: 15, fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 },
  mascotContainer: { position: 'absolute', bottom: -height * 0.12, left: 0, right: 0, alignItems: 'center', justifyContent: 'flex-end' },
  firstSlideMascot: { width: width * 1.18, height: width * 1.20 },
});
