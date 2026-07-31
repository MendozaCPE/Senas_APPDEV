// app/assessment.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { api } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Icons ──────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <View style={styles.checkIconWrapper}>
      <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <Polyline points="20 6 9 17 4 12" />
      </Svg>
    </View>
  );
}
function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}
function TrophyIcon({ size = 40, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 21h8" /><Path d="M12 17v4" />
      <Path d="M7 4h10v5a5 5 0 0 1-10 0V4z" fill={color} stroke={color} />
      <Path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4" />
      <Path d="M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" />
    </Svg>
  );
}

// ─── Cloud motif — same shape language as dashboard/lessons/gesture ──────
function CloudPuffs({ cw, ch, variant }: { cw: number; ch: number; variant: number }) {
  const w = '#ffffff';
  switch (variant % 3) {
    case 0:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.08, width: cw * 0.50, height: ch * 0.72, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.35, width: cw * 0.60, height: ch * 0.88, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw, height: ch * 0.52, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    default:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.04, width: cw * 0.40, height: ch * 0.95, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.48, width: cw * 0.46, height: ch * 0.80, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw, height: ch * 0.45, borderRadius: 999, backgroundColor: w }} />
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

// ─── Question Options ──────────────────────────────────────────────────────
const familiarityOptions = [
  { label: "I've never tried it", value: 'Beginner', icon: require('../assets/images/img/never.png') },
  { label: 'I know a few signs', value: 'Beginner', icon: require('../assets/images/img/few.png') },
  { label: 'I can hold basic conversations', value: 'Intermediate', icon: require('../assets/images/img/conversation.png') },
  { label: 'I am quite experienced', value: 'Advanced', icon: require('../assets/images/img/experienced.png') },
];

const goalOptions = [
  { label: 'Alphabet & Numbers', value: 'Alphabet_Numbers', icon: require('../assets/images/img/alphabet.png') },
  { label: 'Greetings & Basic Phrases', value: 'Greetings', icon: require('../assets/images/img/greet.png') },
  { label: 'Classroom Words', value: 'Classroom_Words', icon: require('../assets/images/img/classroom.png') },
  { label: 'Everything!', value: 'Everything', icon: require('../assets/images/img/everything.png') },
];

const timeOptions = [
  { label: '5–10 minutes', value: '5_10_min', icon: require('../assets/images/img/time.png') },
  { label: '15–20 minutes', value: '15_20_min', icon: require('../assets/images/img/time.png') },
  { label: '30 minutes', value: '30_min', icon: require('../assets/images/img/time.png') },
  { label: '1 hour or more', value: '1_hour_plus', icon: require('../assets/images/img/time.png') },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Assessment() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [studentLevel, setStudentLevel] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [showLevelScreen, setShowLevelScreen] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [step]);

  const getQuestions = () => {
    if (studentLevel) {
      return [
        { title: 'What do you mainly want to learn?', subtitle: 'Pick what interests you most', options: goalOptions, key: 'learning_goal', senyaMessage: "What sparks your curiosity? ✨" },
        { title: 'How much time can you practice daily?', subtitle: 'Choose what fits your schedule', options: timeOptions, key: 'practice_time', senyaMessage: 'Consistency is key! 🏆' },
      ];
    }
    return [
      { title: 'How familiar are you with Filipino Sign Language?', subtitle: 'Choose the option that best describes you', options: familiarityOptions, key: 'fsl_level', senyaMessage: "Let's find your perfect level! 🌟" },
      { title: 'What do you mainly want to learn?', subtitle: 'Pick what interests you most', options: goalOptions, key: 'learning_goal', senyaMessage: 'What sparks your curiosity? ✨' },
      { title: 'How much time can you practice daily?', subtitle: 'Choose what fits your schedule', options: timeOptions, key: 'practice_time', senyaMessage: 'Consistency is key! 🏆' },
    ];
  };

  const assessmentQuestions = getQuestions();
  const totalQuestions = assessmentQuestions.length;

  useEffect(() => {
    const checkStudentLevel = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          setStudentName(user.student?.first_name || 'Student');
          const level = user.student?.fsl_mastery_level || null;
          setStudentLevel(level);
          if (level) {
            setAnswers(prev => ({ ...prev, fsl_level: level }));
          }
          try {
            const response = await api.getLearningPath();
            if (response && response.learning_path && response.learning_path.is_completed) {
              router.replace('/(tabs)/dashboard');
              return;
            }
          } catch (error) {
            console.log('No learning path found yet');
          }
        }
      } catch (error) {
        console.error('Error checking student level:', error);
      } finally {
        setLoading(false);
      }
    };
    checkStudentLevel();
  }, []);

  const currentQuestion = assessmentQuestions[step];
  const progress = ((step + 1) / totalQuestions) * 100;

  const selectOption = (index: number) => {
    setSelected(index);
    const option = currentQuestion.options[index];
    setAnswers(prev => ({ ...prev, [currentQuestion.key]: option.value }));
  };

  const next = () => {
    if (selected === null) return;
    if (step < totalQuestions - 1) {
      setStep(step + 1);
      setSelected(null);
    } else {
      saveLearningPath();
    }
  };

  const back = () => {
    if (step > 0) {
      setStep(step - 1);
      const prevKey = assessmentQuestions[step - 1].key;
      const prevAnswer = answers[prevKey];
      if (prevAnswer) {
        const prevOptions = assessmentQuestions[step - 1].options;
        const prevIndex = prevOptions.findIndex(opt => opt.value === prevAnswer);
        setSelected(prevIndex >= 0 ? prevIndex : null);
      } else {
        setSelected(null);
      }
    } else {
      Alert.alert(
        'Skip Assessment?',
        'You will use the default learning path. You can always complete this later in your profile.',
        [
          { text: 'Continue Assessment', style: 'cancel' },
          { text: 'Skip to Dashboard', onPress: () => router.replace('/(tabs)/dashboard') },
        ]
      );
    }
  };

  const saveLearningPath = async () => {
    setSaving(true);
    try {
      const learningPathData = {
        fsl_level: studentLevel || answers.fsl_level || 'Beginner',
        learning_goal: answers.learning_goal || 'Everything',
        practice_time: answers.practice_time || '30_min',
      };

      await api.saveLearningPath(learningPathData);

      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.student) {
          user.student.fsl_mastery_level = learningPathData.fsl_level;
          await AsyncStorage.setItem('userData', JSON.stringify(user));
        }
      }

      setShowCompletion(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save your learning path. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  // ─── Assigned Level Screen — navy hero + white summary card ────────────
  if (studentLevel && !showLevelScreen) {
    const levelColors: Record<string, string> = { Beginner: '#10B981', Intermediate: '#8B5CF6', Advanced: '#F59E0B' };
    const levelEmojis: Record<string, string> = { Beginner: '🌱', Intermediate: '📈', Advanced: '🚀' };
    const lvlColor = levelColors[studentLevel] || '#2563EB';

    return (
      <SafeAreaView style={styles.heroSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.cloudLayer} pointerEvents="none">
          <DriftingCloud top={20} size={1.6} duration={22000} startX={0} opacity={0.18} variant={0} trackWidth={SCREEN_WIDTH} />
          <DriftingCloud top={80} size={1.1} duration={17000} startX={SCREEN_WIDTH * 0.5} opacity={0.14} variant={1} trackWidth={SCREEN_WIDTH} />
        </View>

        <ScrollView contentContainerStyle={styles.heroScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heroLogo}>SEÑAS</Text>

          <Animated.View style={[styles.heroContentWrap, { opacity: fadeAnim }]}>
            <View style={styles.heroBadgeCircle}>
              <Text style={styles.heroBadgeEmoji}>{levelEmojis[studentLevel] || '🌟'}</Text>
            </View>
            <Text style={styles.heroEyebrow}>YOUR TEACHER ASSIGNED YOU</Text>
            <View style={[styles.levelChip, { backgroundColor: lvlColor }]}>
              <Text style={styles.levelChipText}>{studentLevel}</Text>
            </View>
            <Text style={styles.heroDesc}>
              {studentName}, you've been placed in the <Text style={{ fontWeight: '800', color: '#fde68a' }}>{studentLevel}</Text> level. Ready to start your journey?
            </Text>
          </Animated.View>

          {/* White action card — uniform card language w/ rest of app */}
          <View style={styles.whiteCard}>
            <Pressable style={[styles.primaryActionBtn, { backgroundColor: lvlColor }]} onPress={() => router.replace('/(tabs)/dashboard')}>
              <Text style={styles.primaryActionText}>🚀 Start Learning</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryActionBtn}
              onPress={() => {
                setShowLevelScreen(true);
                setStep(0);
                setSelected(null);
                setAnswers(prev => ({ ...prev, fsl_level: studentLevel }));
              }}
            >
              <Text style={styles.secondaryActionText}>Take Assessment to Confirm</Text>
            </Pressable>

            <View style={styles.mascotRow}>
              <Image source={require('../assets/images/img/senya_teaching.png')} style={styles.mascotSmall} contentFit="contain" />
              <View style={styles.speechBubbleFlat}>
                <Text style={styles.speechText}>You've got this! 💪</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Completion Screen — navy hero + summary chips ─────────────────────
  if (showCompletion) {
    const level = studentLevel || answers.fsl_level || 'Beginner';
    const levelColors: Record<string, string> = { Beginner: '#10B981', Intermediate: '#8B5CF6', Advanced: '#F59E0B' };
    const lvlColor = levelColors[level] || '#2563EB';

    return (
      <SafeAreaView style={styles.heroSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.cloudLayer} pointerEvents="none">
          <DriftingCloud top={20} size={1.6} duration={22000} startX={0} opacity={0.18} variant={0} trackWidth={SCREEN_WIDTH} />
          <DriftingCloud top={80} size={1.1} duration={17000} startX={SCREEN_WIDTH * 0.5} opacity={0.14} variant={2} trackWidth={SCREEN_WIDTH} />
        </View>

        <ScrollView contentContainerStyle={styles.heroScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heroLogo}>SEÑAS</Text>

          <Animated.View style={[styles.heroContentWrap, { opacity: fadeAnim }]}>
            <View style={[styles.heroBadgeCircle, { backgroundColor: 'rgba(16,185,129,0.22)' }]}>
              <TrophyIcon size={34} color="#fde68a" />
            </View>
            <Text style={styles.heroEyebrow}>SETUP COMPLETE</Text>
            <Text style={styles.completionTitleText}>Learning Path Set! 🎉</Text>
            <Text style={styles.heroDesc}>We've created a personalized learning path just for you.</Text>
          </Animated.View>

          {/* White summary card */}
          <View style={styles.whiteCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>📊 Your Level</Text>
              <View style={[styles.summaryChip, { backgroundColor: `${lvlColor}18` }]}>
                <Text style={[styles.summaryChipText, { color: lvlColor }]}>{level}</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>🎯 Learning Goal</Text>
              <Text style={styles.summaryValue}>{answers.learning_goal?.replace(/_/g, ' ') || 'Everything'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>⏰ Practice Time</Text>
              <Text style={styles.summaryValue}>{answers.practice_time?.replace(/_/g, ' ') || '30 min'}</Text>
            </View>

            <View style={styles.mascotRow}>
              <Image source={require('../assets/images/img/senya_blue.png')} style={styles.mascotSmall} contentFit="contain" />
              <View style={styles.speechBubbleFlat}>
                <Text style={styles.speechText}>I'm so excited for you! 🥳</Text>
              </View>
            </View>

            <Pressable style={[styles.primaryActionBtn, { backgroundColor: lvlColor, marginTop: 18 }]} onPress={() => router.replace('/(tabs)/dashboard')}>
              <Text style={styles.primaryActionText}>🚀 Start Learning</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Assessment Flow — navy header + progress, speech-bubble question ──
  const currentOptions = currentQuestion.options;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header: navy gradient + clouds, uniform w/ dashboard/lessons/gesture/quiz */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.cloudLayer} pointerEvents="none">
          <DriftingCloud top={6} size={1.2} duration={19000} startX={0} opacity={0.18} variant={0} trackWidth={SCREEN_WIDTH} />
          <DriftingCloud top={40} size={0.9} duration={15000} startX={SCREEN_WIDTH * 0.5} opacity={0.14} variant={1} trackWidth={SCREEN_WIDTH} />
        </View>

        <View style={styles.headerTopRow}>
          <Pressable style={styles.backBtn} onPress={back}>
            <BackIcon />
          </Pressable>
          <Text style={styles.headerLogo}>SEÑAS</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressTextLeft}>Question {step + 1} of {totalQuestions}</Text>
            <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, marginTop: 16 }}>
          <Text style={styles.title}>{currentQuestion.title}</Text>
          <Text style={styles.subtitle}>{currentQuestion.subtitle}</Text>
        </Animated.View>
      </View>

      {/* Body: white, speech-bubble mascot + option list */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.senyaContainer}>
          <Image source={require('../assets/images/img/senya_teaching.png')} style={styles.senyaMascot} contentFit="contain" />
          <View style={styles.speechBubble}>
            <View style={styles.speechBubbleTail} />
            <Text style={styles.speechTextBody}>{currentQuestion.senyaMessage || "Let's learn together! 🌟"}</Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {currentOptions.map((option, index) => {
            const isSelected = selected === index;
            return (
              <Pressable
                key={index}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => selectOption(index)}
              >
                <View style={[styles.optionIconBox, isSelected && { backgroundColor: '#DBEAFE' }]}>
                  <Image source={option.icon} style={styles.optionIcon} contentFit="contain" />
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
                {isSelected && <CheckIcon />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.nextBtn, selected === null && styles.nextBtnDisabled]}
          onPress={next}
          disabled={selected === null || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step < totalQuestions - 1 ? 'Next Question →' : '🎉 Complete Setup'}
            </Text>
          )}
        </Pressable>

        {studentLevel && showLevelScreen && (
          <Pressable style={styles.skipAssessmentBtn} onPress={() => router.replace('/(tabs)/dashboard')}>
            <Text style={styles.skipAssessmentText}>Skip Assessment</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, color: '#fff', fontWeight: '600' },

  cloudLayer: { position: 'absolute', top: 0, left: 0, right: 0, height: 110, overflow: 'hidden' },

  // ── Assessment header ──
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 8 : 16, paddingBottom: 20, overflow: 'hidden' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  headerLogo: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },

  progressWrap: {},
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressTextLeft: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  progressPct: { fontSize: 12, fontWeight: '800', color: '#fde68a' },
  progressBarTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 99, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FFC800', borderRadius: 99 },

  title: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 27, marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  // ── Body ──
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },

  senyaContainer: { alignItems: 'center', marginBottom: 20 },
  senyaMascot: { width: 66, height: 66 },
  speechBubble: {
    backgroundColor: '#EFF6FF', borderRadius: 16, paddingVertical: 9, paddingHorizontal: 16,
    marginTop: 6, position: 'relative',
  },
  speechBubbleTail: {
    position: 'absolute', top: -7, alignSelf: 'center',
    width: 14, height: 14, backgroundColor: '#EFF6FF', transform: [{ rotate: '45deg' }],
  },
  speechBubbleFlat: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, borderBottomLeftRadius: 4,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  speechText: { fontSize: 12.5, fontWeight: '700', color: '#0f3172' },
  speechTextBody: { fontSize: 13, fontWeight: '700', color: '#0f3172', textAlign: 'center' },

  optionsContainer: { gap: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18,
    borderWidth: 2, borderColor: '#F1F5F9', backgroundColor: '#fff',
    shadowColor: '#0f3172', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  optionCardSelected: {
    borderColor: '#2563EB', backgroundColor: '#EFF6FF',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3,
  },
  optionIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  optionIcon: { width: 30, height: 30 },
  optionText: { flex: 1, fontSize: 14.5, fontWeight: '700', color: '#0f3172' },
  optionTextSelected: { color: '#1D4ED8' },
  checkIconWrapper: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Footer ──
  footer: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  nextBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 60,
    backgroundColor: '#1848c8', alignItems: 'center',
    shadowColor: '#1848c8', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 10,
  },
  nextBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  skipAssessmentBtn: { marginTop: 10, alignItems: 'center', padding: 8 },
  skipAssessmentText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },

  // ── Hero screens (assigned level / completion) ──
  heroSafeArea: { flex: 1 },
  heroScroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 12 : 20, paddingBottom: 40 },
  heroLogo: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: 24 },

  heroContentWrap: { alignItems: 'center', marginBottom: 24 },
  heroBadgeCircle: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroBadgeEmoji: { fontSize: 34 },
  heroEyebrow: { fontSize: 11, fontWeight: '800', color: '#fde68a', letterSpacing: 1, marginBottom: 10 },
  levelChip: { paddingVertical: 8, paddingHorizontal: 28, borderRadius: 24, marginBottom: 14 },
  levelChipText: { color: '#fff', fontSize: 19, fontWeight: '900', letterSpacing: 0.5 },
  completionTitleText: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 10 },
  heroDesc: { fontSize: 13.5, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },

  whiteCard: {
    backgroundColor: '#fff', borderRadius: 26, padding: 22,
    shadowColor: '#0f3172', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6,
  },
  primaryActionBtn: {
    paddingVertical: 15, borderRadius: 60, alignItems: 'center',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryActionBtn: {
    paddingVertical: 13, borderRadius: 60, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#DBEAFE', marginTop: 10,
  },
  secondaryActionText: { color: '#2563EB', fontSize: 13.5, fontWeight: '700' },

  mascotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  mascotSmall: { width: 42, height: 42 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  summaryChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  summaryChipText: { fontSize: 13.5, fontWeight: '800' },
  summaryValue: { fontSize: 13.5, color: '#0f3172', fontWeight: '700', textTransform: 'capitalize' },
  summaryDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
});