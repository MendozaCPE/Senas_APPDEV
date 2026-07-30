import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Path } from 'react-native-svg';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── SVG Icons ──────────────────────────────────────────────────────────
function StarIcon({ size = 14, color = '#F59E0B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function FlameIcon({ size = 14, color = '#fb923c' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2c0 6-8 8-8 14a8 8 0 0016 0C20 10 12 8 12 2z" />
    </Svg>
  );
}

function SparkleIcon({ size = 16, color = '#FDE68A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </Svg>
  );
}

// ── Drifting Cloud Animation ──────────────────────────────────────────
function CloudPuffs({ cw, ch, variant }: { cw: number; ch: number; variant: number }) {
  const w = '#ffffff';
  switch (variant % 3) {
    case 0:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.08, width: cw * 0.5, height: ch * 0.72, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.35, width: cw * 0.6, height: ch * 0.88, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw, height: ch * 0.52, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 1:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.2, width: cw * 0.6, height: ch * 1.0, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw * 0.5, height: ch * 0.6, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.52, width: cw * 0.48, height: ch * 0.55, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    default:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.04, width: cw * 0.4, height: ch * 0.95, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.48, width: cw * 0.46, height: ch * 0.8, borderRadius: 999, backgroundColor: w }} />
        </>
      );
  }
}

function DriftingCloud({ top, size = 1, duration = 22000, startX = 0, opacity = 0.5, variant = 0, trackWidth }: {
  top: number; size?: number; duration?: number; startX?: number; opacity?: number; variant?: number; trackWidth: number;
}) {
  const totalTravel = trackWidth + trackWidth * 0.5;
  const initialX = -trackWidth * 0.5 + (startX % totalTravel);
  const translateX = useRef(new Animated.Value(initialX)).current;

  useEffect(() => {
    const remaining = totalTravel - (initialX + trackWidth * 0.5);
    const firstDuration = Math.max((remaining / totalTravel) * duration, 100);

    Animated.timing(translateX, {
      toValue: trackWidth + trackWidth * 0.5,
      duration: firstDuration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(-trackWidth * 0.5);
      Animated.loop(
        Animated.timing(translateX, {
          toValue: trackWidth + trackWidth * 0.5,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });

    return () => translateX.stopAnimation();
  }, []);

  const cw = 70 * size;
  const ch = 26 * size;

  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top, left: 0, opacity, transform: [{ translateX }] }}>
      <View style={{ width: cw, height: ch * 1.1 }}>
        <CloudPuffs cw={cw} ch={ch} variant={variant} />
      </View>
    </Animated.View>
  );
}

// ── Dummy Quiz Questions (Child-Friendly Mock Data) ────────────────────
const MOCK_QUESTIONS = [
  {
    id: 1,
    question: "What does this sign mean?",
    image: require('../../assets/images/img/hello.jpg'),
    options: ["Please", "Thank You", "Hello", "Goodbye"],
    correctIndex: 2,
  },
  {
    id: 2,
    question: "Which letter is shown here?",
    image: require('../../assets/images/img/a.jpg'),
    options: ["Letter A", "Letter B", "Letter C", "Letter D"],
    correctIndex: 0,
  },
  {
    id: 3,
    question: "How do you sign the number 1?",
    image: require('../../assets/images/img/one.jpg'),
    options: ["Open Palm", "Clenched Fist", "One Finger Up", "Peace Sign"],
    correctIndex: 2,
  },
];

// ── Main Multiple Choice Quiz Component ───────────────────────────────
export default function MCQuiz() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setTotalXP(user.student?.total_xp || 0);
        setStreakDays(user.student?.streak_days || 0);
      }
      const response = await api.getStudentLessons();
      if (response.success && response.student) {
        setTotalXP(response.student.total_xp || 0);
        setStreakDays(response.student.streak_days || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || isSubmitted) return;

    setIsSubmitted(true);
    const isCorrect = selectedIndex === MOCK_QUESTIONS[currentIndex].correctIndex;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setShowConfetti(true);
    }

    // Animate Card Bounce
    Animated.sequence([
      Animated.timing(cardScale, { toValue: 0.98, duration: 100, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const handleNext = () => {
    if (currentIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setIsSubmitted(false);
      setShowConfetti(false);
    } else {
      setIsCompleted(true);
      setShowConfetti(true);
    }
  };

  const currentQ = MOCK_QUESTIONS[currentIndex];
  const progressPct = ((currentIndex + 1) / MOCK_QUESTIONS.length) * 100;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1E4F8A" />
        <Text style={styles.loadingText}>Preparing your fun quiz...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <Text style={styles.logoText}>SEÑAS</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>✕</Text>
          </Pressable>

        </View>

        {!isCompleted ? (
          <>
            {/* ── Quiz Progress Hero Banner ── */}
            <View style={styles.section}>
              <View style={styles.bannerWrapper}>
                <LinearGradient
                  colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bannerCard}
                >
                  <DriftingCloud top={6} size={1.2} duration={20000} startX={0} opacity={0.2} variant={1} trackWidth={SCREEN_WIDTH - 32} />

                  <View style={styles.bannerContent}>
                    <View style={styles.bannerHeader}>
                      <Text style={styles.bannerSubtitle}>Multiple Choice Quiz</Text>
                      <View style={styles.pillCount}>
                        <SparkleIcon size={12} color="#FDE68A" />
                        <Text style={styles.pillCountText}>
                          {currentIndex + 1} / {MOCK_QUESTIONS.length}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Track */}
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* ── Question Card ── */}
            <Animated.View style={[styles.section, { transform: [{ scale: cardScale }] }]}>
              <View style={styles.questionCard}>
                <Text style={styles.questionTitle}>{currentQ.question}</Text>

                {currentQ.image && (
                  <View style={styles.imageBox}>
                    <Image source={currentQ.image} style={styles.questionImage} contentFit="contain" />
                  </View>
                )}

                {/* ── Options List ── */}
                <View style={styles.optionsList}>
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedIndex === idx;
                    const isCorrect = currentQ.correctIndex === idx;

                    let btnStyle: StyleProp<ViewStyle> = styles.optionBtn;
                    let textStyle: StyleProp<TextStyle> = styles.optionText;

                    if (isSubmitted) {
                      if (isCorrect) {
                        btnStyle = [styles.optionBtn, styles.optionCorrect];
                        textStyle = [styles.optionText, styles.optionTextWhite];
                      } else if (isSelected && !isCorrect) {
                        btnStyle = [styles.optionBtn, styles.optionWrong];
                        textStyle = [styles.optionText, styles.optionTextWhite];
                      }
                    } else if (isSelected) {
                      btnStyle = [styles.optionBtn, styles.optionSelected];
                      textStyle = [styles.optionText, styles.optionTextSelected];
                    }

                    return (
                      <Pressable
                        key={idx}
                        style={btnStyle}
                        onPress={() => handleSelectOption(idx)}
                      >
                        <View style={styles.optionBadge}>
                          <Text style={[styles.optionBadgeText, (isSelected || (isSubmitted && isCorrect)) && styles.optionTextWhite]}>
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        </View>
                        <Text style={textStyle}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* ── Submit / Next Button ── */}
                <View style={styles.actionRow}>
                  {!isSubmitted ? (
                    <Pressable
                      style={[styles.primaryBtn, selectedIndex === null && styles.btnDisabled]}
                      disabled={selectedIndex === null}
                      onPress={handleSubmit}
                    >
                      <Text style={styles.primaryBtnText}>Check Answer</Text>
                    </Pressable>
                  ) : (
                    <Pressable style={styles.primaryBtn} onPress={handleNext}>
                      <Text style={styles.primaryBtnText}>
                        {currentIndex < MOCK_QUESTIONS.length - 1 ? "Next Question →" : "See Results 🎉"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Animated.View>
          </>
        ) : (
          /* ── Completion Summary Screen ── */
          <View style={styles.section}>
            <View style={styles.summaryCard}>
              <Image source={require('../../assets/images/img/alphabet_star.png')} style={styles.summaryImage} contentFit="contain" />
              <Text style={styles.summaryTitle}>Awesome Job!</Text>
              <Text style={styles.summarySub}>
                You scored <Text style={styles.highlightText}>{score}</Text> out of <Text style={styles.highlightText}>{MOCK_QUESTIONS.length}</Text>!
              </Text>

              <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
                <Text style={styles.primaryBtnText}>Back</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {
        showConfetti && (
          <ConfettiCannon
            count={120}
            origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
            autoStart={true}
            fadeOut={true}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        )
      }
    </SafeAreaView >
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  loadingText: { marginTop: 14, fontSize: 14, fontWeight: '700', color: '#0f3172' },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 16, fontWeight: '800', color: '#0f3172' },
  logoText: { color: '#0f3172', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    elevation: 2,
  },
  statPillText: { fontSize: 12, fontWeight: '700', color: '#0f3172' },
  streakBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    elevation: 2,
  },
  streakText: { color: '#0f3172', fontSize: 13, fontWeight: '700' },

  // Layout Section
  section: { paddingHorizontal: 16, marginBottom: 16 },

  // Hero Banner Card
  bannerWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0d326b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  bannerCard: { padding: 18, minHeight: 100, justifyContent: 'center' },
  bannerContent: { zIndex: 2 },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bannerSubtitle: { fontSize: 12, fontWeight: '800', color: '#FDE68A', textTransform: 'uppercase', letterSpacing: 0.8 },
  pillCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pillCountText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  progressTrack: { height: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FBBF24', borderRadius: 99 },

  // Question Box
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  questionTitle: { fontSize: 20, fontWeight: '800', color: '#0f3172', textAlign: 'center', marginBottom: 16 },
  imageBox: { alignItems: 'center', justifyContent: 'center', height: 160, marginBottom: 20, backgroundColor: '#F8FAFC', borderRadius: 16 },
  questionImage: { width: '80%', height: '80%' },

  // Options List
  optionsList: { gap: 12, marginBottom: 20 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  optionSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  optionCorrect: { borderColor: '#10B981', backgroundColor: '#10B981' },
  optionWrong: { borderColor: '#EF4444', backgroundColor: '#EF4444' },

  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 49, 114, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: { fontSize: 14, fontWeight: '800', color: '#0f3172' },

  optionText: { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1 },
  optionTextSelected: { color: '#2563EB' },
  optionTextWhite: { color: '#FFFFFF' },

  // Actions
  actionRow: { marginTop: 8 },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 100,
  },
  btnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  // Completion Screen
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECF0',
    elevation: 3,
    marginTop: 20,
  },
  summaryImage: { width: 140, height: 140, marginBottom: 16 },
  summaryTitle: { fontSize: 26, fontWeight: '800', color: '#0f3172', marginBottom: 8 },
  summarySub: { fontSize: 16, fontWeight: '600', color: '#64748B', marginBottom: 24 },
  highlightText: { color: '#2563EB', fontWeight: '800' },
});