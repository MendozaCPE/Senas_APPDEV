// app/module-quiz/[id].tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Types ────────────────────────────────────────────────────────────────────
interface QuizOption {
  option_id: number;
  option_text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  question_id: number;
  question_type: 'multiple_choice' | 'true_false';
  question_text: string;
  points: number;
  options: QuizOption[];
}

interface UserAnswer {
  question_id: number;
  selected_option_id: number | null;
}

// ── Palette ───────────────────────────────────────────────────────────────────
const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#A855F7';
const GOLD = '#F59E0B';
const GREEN = '#10B981';
const RED = '#EF4444';
const BG_FROM = '#1e0a3c';
const BG_MID = '#3b0f6b';
const BG_TO = '#5b21b6';

// ── Small SVG icons ───────────────────────────────────────────────────────────
function TrophyIcon({ size = 28, color = '#F59E0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 21h8" />
      <Path d="M12 17v4" />
      <Path d="M7 4h10v5a5 5 0 0 1-10 0V4z" fill={color} stroke={color} />
      <Path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4" />
      <Path d="M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

function XIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

function BackIcon({ color = '#fff', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

// ── Animated progress ring ───────────────────────────────────────────────────
function ProgressRing({ pct, size = 130 }: { pct: number; size?: number }) {
  const r = (size - 14) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * circ;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#FBBF24" />
        </SvgGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.15)" strokeWidth={14} fill="none" />
      <Circle
        cx={cx} cy={cy} r={r}
        stroke="url(#ringGrad)" strokeWidth={14} fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </Svg>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ModuleQuizScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const moduleId = parseInt(id || '0', 10);

  // ── state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── results state ────────────────────────────────────────────────────────
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState<{
    score: number; total: number; percentage: number; passed: boolean; xpEarned: number;
  } | null>(null);

  // ── animations ────────────────────────────────────────────────────────────
  const cardAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // ── load quiz ─────────────────────────────────────────────────────────────
  const loadQuiz = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getModuleQuiz(moduleId);
      setModuleTitle(data.module_title);
      setQuestions(data.questions || []);
      setAnswers((data.questions || []).map((q: QuizQuestion) => ({
        question_id: q.question_id,
        selected_option_id: null,
      })));
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  // ── animate card in ───────────────────────────────────────────────────────
  const animateCardIn = useCallback(() => {
    cardAnim.setValue(0);
    Animated.timing(cardAnim, {
      toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [cardAnim]);

  useEffect(() => {
    if (!loading && questions.length > 0) animateCardIn();
  }, [loading, currentIndex, animateCardIn, questions.length]);

  // ── handle option select ──────────────────────────────────────────────────
  const handleSelectOption = (optionId: number) => {
    if (answered) return;
    setSelectedOption(optionId);
    setAnswered(true);
    setAnswers(prev => prev.map(a =>
      a.question_id === questions[currentIndex].question_id
        ? { ...a, selected_option_id: optionId }
        : a
    ));
    feedbackAnim.setValue(0);
    Animated.timing(feedbackAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  // ── next question / submit ────────────────────────────────────────────────
  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
      feedbackAnim.setValue(0);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = answers.filter(a => a.selected_option_id !== null) as { question_id: number; selected_option_id: number; }[];
      const result = await api.submitModuleQuiz(moduleId, payload);
      setResultData({
        score: result.score,
        total: result.total,
        percentage: result.percentage,
        passed: result.passed,
        xpEarned: result.xp_earned || 0,
      });
      setShowResults(true);
      Animated.timing(resultAnim, {
        toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    setShowResults(false);
    setCurrentIndex(0);
    setAnswered(false);
    setSelectedOption(null);
    setResultData(null);
    resultAnim.setValue(0);
    await loadQuiz();
  };

  // ── helpers ───────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex];
  const isCorrect = answered && currentQuestion?.options.find(o => o.option_id === selectedOption)?.is_correct;
  const progress = questions.length > 0
    ? ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100
    : 0;

  // ────────────────────────────────────────────────────────────────────────────
  // LOADING
  // ────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <LinearGradient colors={[BG_FROM, BG_MID, BG_TO]} style={StyleSheet.absoluteFillObject} />
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={s.loadingText}>Preparing checkpoint quiz…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ERROR
  if (error || questions.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <LinearGradient colors={[BG_FROM, BG_MID, BG_TO]} style={StyleSheet.absoluteFillObject} />
        <View style={s.centered}>
          <Text style={{ fontSize: 48 }}>😕</Text>
          <Text style={[s.loadingText, { marginTop: 12 }]}>
            {error || 'No questions found for this module yet.'}
          </Text>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>← Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RESULTS SCREEN
  // ────────────────────────────────────────────────────────────────────────────
  if (showResults && resultData) {
    const { score, total, percentage, passed, xpEarned } = resultData;
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient colors={[BG_FROM, BG_MID, BG_TO]} style={StyleSheet.absoluteFillObject} />

        <ScrollView
          contentContainerStyle={s.resultScroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              s.resultCard,
              {
                opacity: resultAnim,
                transform: [{
                  translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                }],
              },
            ]}
          >
            {/* Big emoji badge */}
            <View style={[s.resultBadge, { backgroundColor: passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
              <Text style={{ fontSize: 60 }}>{passed ? '🏆' : '😓'}</Text>
            </View>

            <Text style={[s.resultTitle, { color: passed ? GREEN : RED }]}>
              {passed ? 'Module Cleared!' : 'Not Quite Yet'}
            </Text>
            <Text style={s.resultModuleTitle}>{moduleTitle}</Text>

            {/* Score ring */}
            <View style={s.ringContainer}>
              <ProgressRing pct={percentage} size={130} />
              <View style={s.ringInner}>
                <Text style={s.ringPct}>{Math.round(percentage)}%</Text>
                <Text style={s.ringLabel}>{score}/{total}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={s.statRow}>
              <View style={[s.statBox, { backgroundColor: 'rgba(99,102,241,0.18)' }]}>
                <Text style={[s.statVal, { color: '#A5B4FC' }]}>{score}</Text>
                <Text style={s.statLbl}>Correct</Text>
              </View>
              <View style={[s.statBox, { backgroundColor: 'rgba(239,68,68,0.18)' }]}>
                <Text style={[s.statVal, { color: '#FCA5A5' }]}>{total - score}</Text>
                <Text style={s.statLbl}>Wrong</Text>
              </View>
              {xpEarned > 0 && (
                <View style={[s.statBox, { backgroundColor: 'rgba(16,185,129,0.18)' }]}>
                  <Text style={[s.statVal, { color: '#6EE7B7' }]}>+{xpEarned}</Text>
                  <Text style={s.statLbl}>XP</Text>
                </View>
              )}
            </View>

            {/* Message */}
            <View style={[s.msgBox, {
              backgroundColor: passed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              borderColor: passed ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)',
            }]}>
              <Text style={[s.msgText, { color: passed ? '#6EE7B7' : '#FCD34D' }]}>
                {passed
                  ? `Excellent! You passed with ${Math.round(percentage)}%. The next module is now unlocked! 🎉`
                  : `You need at least 60% to pass. You scored ${Math.round(percentage)}%. Review the lessons and try again!`}
              </Text>
            </View>

            {/* Retry button (only on fail) */}
            {!passed && (
              <Pressable style={[s.actionBtn, { backgroundColor: PURPLE }]} onPress={handleRetry}>
                <Text style={s.actionBtnText}>🔄 Retry Quiz</Text>
              </Pressable>
            )}

            {/* Back to path */}
            <Pressable
              style={[s.actionBtn, {
                backgroundColor: passed ? GREEN : 'rgba(255,255,255,0.12)',
                marginTop: passed ? 0 : 8,
              }]}
              onPress={() => router.replace('/(tabs)/lessons' as any)}
            >
              <Text style={[s.actionBtnText, !passed && { color: 'rgba(255,255,255,0.6)' }]}>
                {passed ? '🗺️ Back to Learning Path' : 'Return to Lessons'}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // QUIZ QUESTION SCREEN
  // ────────────────────────────────────────────────────────────────────────────
  const cardTranslateX = cardAnim.interpolate({
    inputRange: [0, 1], outputRange: [SCREEN_WIDTH * 0.12, 0],
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={[BG_FROM, BG_MID, BG_TO]} style={StyleSheet.absoluteFillObject} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable style={s.headerBackBtn} onPress={() => router.back()}>
          <BackIcon color="#fff" size={22} />
        </Pressable>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={s.headerTitle} numberOfLines={1}>{moduleTitle}</Text>
          <Text style={s.headerSub}>Checkpoint Quiz • {currentIndex + 1} of {questions.length}</Text>
        </View>
        <View style={s.qTypeBadge}>
          <Text style={s.qTypeText}>
            {currentQuestion.question_type === 'true_false' ? 'T / F' : 'MCQ'}
          </Text>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress}%` as any }]} />
      </View>

      <ScrollView
        contentContainerStyle={s.questionScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Question card ── */}
        <Animated.View
          style={[
            s.questionCard,
            { opacity: cardAnim, transform: [{ translateX: cardTranslateX }] },
          ]}
        >
          <View style={s.qNumPill}>
            <TrophyIcon size={13} color={PURPLE_LIGHT} />
            <Text style={s.qNumText}>Question {currentIndex + 1}</Text>
          </View>
          <Text style={s.questionText}>{currentQuestion.question_text}</Text>
        </Animated.View>

        {/* ── Options ── */}
        <View style={s.optionsContainer}>
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === option.option_id;
            const showCorrect = answered && option.is_correct;
            const showWrong = answered && isSelected && !option.is_correct;

            let borderColor: string = 'rgba(255,255,255,0.18)';
            let bg: string = 'rgba(255,255,255,0.07)';

            if (showCorrect) { bg = 'rgba(16,185,129,0.22)'; borderColor = GREEN; }
            else if (showWrong) { bg = 'rgba(239,68,68,0.22)'; borderColor = RED; }
            else if (isSelected) { bg = 'rgba(168,85,247,0.25)'; borderColor = PURPLE_LIGHT; }

            const optionLetter = ['A', 'B', 'C', 'D'][idx] ?? String(idx + 1);

            return (
              <Pressable
                key={option.option_id}
                onPress={() => handleSelectOption(option.option_id)}
                disabled={answered}
                style={({ pressed }) => [
                  s.option,
                  {
                    backgroundColor: bg,
                    borderColor,
                    transform: [{ scale: pressed && !answered ? 0.97 : 1 }],
                  },
                ]}
              >
                <View style={[s.optionLetter, {
                  backgroundColor: showCorrect ? GREEN : showWrong ? RED : isSelected ? PURPLE_LIGHT : 'rgba(255,255,255,0.14)',
                }]}>
                  {showCorrect
                    ? <CheckIcon size={14} color="#fff" />
                    : showWrong
                      ? <XIcon size={14} color="#fff" />
                      : <Text style={s.optionLetterText}>{optionLetter}</Text>
                  }
                </View>
                <Text style={s.optionText} numberOfLines={4}>
                  {option.option_text}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Feedback banner ── */}
        {answered && (
          <Animated.View
            style={[
              s.feedbackBanner,
              {
                backgroundColor: isCorrect ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)',
                borderColor: isCorrect ? GREEN : RED,
                opacity: feedbackAnim,
                transform: [{
                  translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
                }],
              },
            ]}
          >
            <Text style={s.feedbackEmoji}>{isCorrect ? '🎉' : '💡'}</Text>
            <Text style={[s.feedbackText, { color: isCorrect ? '#6EE7B7' : '#FCA5A5' }]}>
              {isCorrect
                ? 'Correct! Great job!'
                : `Correct: ${currentQuestion.options.find(o => o.is_correct)?.option_text ?? '—'}`}
            </Text>
          </Animated.View>
        )}

        {/* ── Next / Submit ── */}
        {answered && (
          <Pressable
            style={[s.nextBtn, submitting && { opacity: 0.6 }]}
            onPress={handleNext}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.nextBtnText}>
                  {currentIndex < questions.length - 1 ? 'Next Question →' : 'Submit Quiz 🏆'}
                </Text>
            }
          </Pressable>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG_FROM },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingText: { color: 'rgba(255,255,255,0.75)', fontSize: 15, marginTop: 14, textAlign: 'center', fontWeight: '600' },
  backBtn: {
    marginTop: 24, backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
  },
  headerBackBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1, fontWeight: '600' },
  qTypeBadge: {
    backgroundColor: 'rgba(168,85,247,0.35)', borderRadius: 10,
    paddingVertical: 5, paddingHorizontal: 12,
    borderWidth: 1.5, borderColor: PURPLE_LIGHT,
  },
  qTypeText: { color: PURPLE_LIGHT, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },

  // Progress bar
  progressTrack: {
    marginHorizontal: 16, height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: {
    height: '100%', backgroundColor: GOLD, borderRadius: 6,
  },

  // Question area
  questionScroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 22, marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  qNumPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(168,85,247,0.2)',
    borderRadius: 20, alignSelf: 'flex-start',
    paddingVertical: 4, paddingHorizontal: 12, marginBottom: 14,
  },
  qNumText: { color: '#E9D5FF', fontSize: 11, fontWeight: '700' },
  questionText: { color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 28 },

  // Options
  optionsContainer: { gap: 12, marginBottom: 16 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, borderWidth: 2,
    paddingVertical: 15, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  optionLetter: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  optionLetterText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  optionText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600', lineHeight: 22 },

  // Feedback
  feedbackBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1.5,
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 16,
  },
  feedbackEmoji: { fontSize: 22 },
  feedbackText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 19 },

  // Next button
  nextBtn: {
    backgroundColor: PURPLE,
    borderRadius: 18, paddingVertical: 16, alignItems: 'center',
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  nextBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 },

  // Results
  resultScroll: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingTop: 48, paddingBottom: 40,
  },
  resultCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 28, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  resultBadge: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  resultTitle: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  resultModuleTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600', marginBottom: 24 },
  ringContainer: {
    position: 'relative', width: 130, height: 130,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  ringInner: { position: 'absolute', alignItems: 'center' },
  ringPct: { color: '#fff', fontSize: 28, fontWeight: '900' },
  ringLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' },
  statBox: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLbl: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  msgBox: { width: '100%', borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 20 },
  msgText: { fontSize: 13, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  actionBtn: {
    width: '100%', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  actionBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});