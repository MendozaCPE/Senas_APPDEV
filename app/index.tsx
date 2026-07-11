import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [ready, setReady] = useState(false); // becomes true once welcome content has settled in

  // Title entrance
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  // Tagline — fades in and STAYS visible (no fade-out)
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(12)).current;

  // Welcome subtitle, appears below the tagline
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(12)).current;

  // Title/tagline block repositioning for the welcome layout
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  // Mascot entrance
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotTranslateY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase(1);
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 700);

    const t2 = setTimeout(() => {
      setPhase(2);
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 1500);

    // Transition into the welcome layout: header lifts up, subtitle and
    // mascot fade/slide in below the tagline (which stays put — no fade-out).
    // Then just wait for a tap.
    const t3 = setTimeout(() => {
      setPhase(3);
      Animated.parallel([
        Animated.timing(headerTranslateY, { toValue: -height * 0.14, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(subtitleTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(mascotOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(mascotTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        setReady(true); // now waiting on the user to tap
      });
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const goToOnboarding = () => {
    if (!ready) return; // ignore taps until the intro has settled
    router.replace('/onboarding');
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={goToOnboarding}>
      <LinearGradient
        colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Decorative circles */}
        <View style={[styles.bgCircle, styles.bgCircleTopLeft]} />
        <View style={[styles.bgCircle, styles.bgCircleTopRight]} />
        <View style={[styles.bgCircle, styles.bgCircleMidLeft]} />
        <View style={[styles.bgCircle, styles.bgCircleMidRight]} />

        {/* Title + Tagline + Subtitle — lifts upward once welcome phase kicks in */}
        <Animated.View style={{ transform: [{ translateY: headerTranslateY }], alignItems: 'center' }}>
          <Animated.View style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            alignItems: 'center',
          }}>
            <Text style={styles.title}>SEÑAS</Text>
          </Animated.View>

          {/* Tagline — fades in and stays visible */}
          <Animated.View style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
            alignItems: 'center',
            marginTop: 16,
          }}>
            <Text style={styles.tagline}>Learn · Practice · Connect</Text>
          </Animated.View>

          {/* Welcome subtitle, appears below the tagline */}
          <Animated.View style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
            alignItems: 'center',
            marginTop: 12,
          }}>
            <Text style={styles.subtitle}>Your guide onto learning Filipino Sign Language</Text>
          </Animated.View>
        </Animated.View>

        {/* Big mascot anchored at the bottom */}
        <Animated.View
          style={[
            styles.mascotContainer,
            { opacity: mascotOpacity, transform: [{ translateY: mascotTranslateY }] },
          ]}
        >
          <Image
            source={require('../assets/images/senya/intro_senya.png')}
            style={styles.firstSlideMascot}
            contentFit="contain"
          />
        </Animated.View>

      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bgCircleTopLeft: { width: 90, height: 90, top: 60, left: -20 },
  bgCircleTopRight: { width: 60, height: 60, top: 110, right: 20 },
  bgCircleMidLeft: { width: 40, height: 40, top: height * 0.38, left: 24 },
  bgCircleMidRight: { width: 70, height: 70, top: height * 0.42, right: -10 },
  title: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#fff',
    lineHeight: 42,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 24,
  },
  tagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  subtitle: {
    color: '#cfe0ff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: -height * 0.12,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  firstSlideMascot: {
    width: width * 1.18,
    height: width * 1.20,
  },
});