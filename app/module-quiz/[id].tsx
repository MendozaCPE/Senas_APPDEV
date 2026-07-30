// app/module-quiz/[id].tsx
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Sound Effects ──────────────────────────────────────────────────────────
const CORRECT_SOUND = require('../../assets/music/correct.mp3');
const WRONG_SOUND = require('../../assets/music/wrong.mp3');
const QUIZ_RESULT_SOUND = require('../../assets/music/quiz-result.mp3');

// ─── Types ───────────────────────────────────────────────────────────────────
interface Option {
  option_id: number;
  option_text: string;
  is_correct: boolean;
}
interface Question {
  question_id: number;
  question_type: string;
  question_text: string;
  points: number;
  options: Option[];
}
interface QuizAttempt {
  percentage: number;
  passed: boolean;
  created_at: string;
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────
function CheckCircleIcon({ color = '#10B981', size = 18 }: { color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><Polyline points="8 12 11 15 16 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
function XCircleIcon({ color = '#EF4444', size = 18 }: { color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></Svg>;
}
function CloseIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round"><Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" /></Svg>;
}
function ArrowRightIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12h14M13 5l7 7-7 7" /></Svg>;
}

// ─── Exit Modal ──────────────────────────────────────────────────────────────
function ExitModal({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.exitModal} onPress={e => e.stopPropagation()}>
          <View style={s.exitIconBox}>
            <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <Polyline points="16 17 21 12 16 7" />
              <Line x1="21" y1="12" x2="9" y2="12" />
            </Svg>
          </View>
          <Text style={s.exitTitle}>Exit Checkpoint?</Text>
          <Text style={s.exitDesc}>You will lose your current quiz progress. Are you sure you want to exit?</Text>
          <View style={s.exitBtns}>
            <Pressable style={s.stayBtn} onPress={onClose}>
              <Text style={s.stayText}>Stay</Text>
            </Pressable>
            <Pressable style={s.exitConfirmBtn} onPress={onConfirm}>
              <Text style={s.exitConfirmText}>Exit</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ModuleQuizViewer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const moduleId = parseInt(id || '0', 10);

  const [loading, setLoading] = useState<boolean>(true);
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionRevealed, setQuestionRevealed] = useState<boolean>(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [currentScore, setCurrentScore] = useState<number>(0);

  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<{
    score: number; total: number; percentage: number;
    xpEarned: number; totalXp: number; level: number; streakDays: number;
  } | null>(null);

  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [attemptHistory, setAttemptHistory] = useState<QuizAttempt[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [confettiFired, setConfettiFired] = useState<boolean>(false);

  const confettiRef = useRef<any>(null);
  const resultsFadeAnim = useRef(new Animated.Value(0)).current;
  const resultsScaleAnim = useRef(new Animated.Value(0.85)).current;
  const resultsScrollRef = useRef<any>(null);

  const senyaBounceAnim = useRef(new Animated.Value(0)).current;
  const senyaShakeAnim = useRef(new Animated.Value(0)).current;

  // Bottom feedback sheet slide-in animation — replaces the old inline feedback row
  const feedbackSlideAnim = useRef(new Animated.Value(0)).current;

  // ── Audio state ──
  const [correctSound, setCorrectSound] = useState<Audio.Sound | null>(null);
  const [wrongSound, setWrongSound] = useState<Audio.Sound | null>(null);
  const [resultSound, setResultSound] = useState<Audio.Sound | null>(null);
  const [isSoundPlaying, setIsSoundPlaying] = useState<boolean>(false);

  async function playCorrectSound() {
    try {
      if (isSoundPlaying) return;
      setIsSoundPlaying(true);
      if (correctSound) await correctSound.unloadAsync();

      const { sound } = await Audio.Sound.createAsync(
        CORRECT_SOUND,
        { shouldPlay: true, isLooping: false, volume: 0.9 }
      );
      setCorrectSound(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          setCorrectSound(null);
          setIsSoundPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play correct sound:', error);
      setIsSoundPlaying(false);
    }
  }

  async function playWrongSound() {
    try {
      if (isSoundPlaying) return;
      setIsSoundPlaying(true);
      if (wrongSound) await wrongSound.unloadAsync();

      const { sound } = await Audio.Sound.createAsync(
        WRONG_SOUND,
        { shouldPlay: true, isLooping: false, volume: 0.6 }
      );
      setWrongSound(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          setWrongSound(null);
          setIsSoundPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play wrong sound:', error);
      setIsSoundPlaying(false);
    }
  }

  async function playResultSound() {
    try {
      if (resultSound) await resultSound.unloadAsync();

      const { sound } = await Audio.Sound.createAsync(
        QUIZ_RESULT_SOUND,
        { shouldPlay: true, isLooping: false, volume: 0.8 }
      );
      setResultSound(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          setResultSound(null);
        }
      });
    } catch (error) {
      console.error('Failed to play result sound:', error);
    }
  }

  const animateSenyaCorrect = () => {
    senyaBounceAnim.setValue(0);
    Animated.spring(senyaBounceAnim, {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true
    }).start();
  };

  const animateSenyaIncorrect = () => {
    senyaShakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(senyaShakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(senyaShakeAnim, { toValue: -0.8, duration: 40, useNativeDriver: true }),
      Animated.timing(senyaShakeAnim, { toValue: 0.6, duration: 40, useNativeDriver: true }),
      Animated.timing(senyaShakeAnim, { toValue: -0.4, duration: 40, useNativeDriver: true }),
      Animated.timing(senyaShakeAnim, { toValue: 0.2, duration: 40, useNativeDriver: true }),
      Animated.timing(senyaShakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]).start();
  };

  const fetchModuleQuiz = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getModuleQuiz(moduleId);
      if (response.success) {
        setModuleTitle(response.module_title);
        setQuestions(response.questions || []);
        setAttemptHistory(response.attempts || []);
      }
    } catch (error) {
      console.error('Error fetching module quiz:', error);
      alert('Failed to load module checkpoint. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModuleQuiz();

    return () => {
      if (correctSound) correctSound.unloadAsync();
      if (wrongSound) wrongSound.unloadAsync();
      if (resultSound) resultSound.unloadAsync();
    };
  }, [fetchModuleQuiz]);

  useEffect(() => {
    if (quizSubmitted && quizResult) {
      playResultSound();

      resultsFadeAnim.setValue(0);
      resultsScaleAnim.setValue(0.85);

      Animated.parallel([
        Animated.timing(resultsFadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(resultsScaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();

      if (quizResult.percentage >= 60 && !confettiFired) {
        setTimeout(() => {
          confettiRef.current?.start();
          setConfettiFired(true);
        }, 400);
      }
    }
  }, [quizSubmitted, quizResult]);

  const handleExit = () => {
    setShowExitModal(false);
    router.dismiss();
  };

  const handleOptionSelect = async (optionIndex: number) => {
    if (questionRevealed) return;
    setSelectedOption(optionIndex);
    setQuestionRevealed(true);

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQ?.options.findIndex(o => o.is_correct);

    if (isCorrect) {
      await playCorrectSound();
      animateSenyaCorrect();
      setCurrentScore(s => s + 1);
    } else {
      await playWrongSound();
      animateSenyaIncorrect();
    }

    const selectedOptionId = currentQ?.options[optionIndex]?.option_id;
    setQuizAnswers(prev => ({
      ...prev,
      [currentQ.question_id]: selectedOptionId
    }));

    feedbackSlideAnim.setValue(0);
    Animated.spring(feedbackSlideAnim, { toValue: 1, friction: 9, tension: 70, useNativeDriver: true }).start();
  };

  const handleNextQuestion = () => {
    Animated.timing(feedbackSlideAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedOption(null);
        setQuestionRevealed(false);
      } else {
        submitQuiz();
      }
    });
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      const payload = Object.keys(quizAnswers).map(qId => ({
        question_id: parseInt(qId, 10),
        selected_option_id: quizAnswers[parseInt(qId, 10)]
      }));

      const response = await api.submitModuleQuiz(moduleId, payload);

      if (response.success) {
        setQuizResult({
          score: response.score,
          total: response.total,
          percentage: response.percentage,
          xpEarned: response.xp_earned || 0,
          totalXp: response.total_xp || 0,
          level: response.level || 1,
          streakDays: response.streak_days || 0,
        });
        setQuizSubmitted(true);
        const freshQuiz = await api.getModuleQuiz(moduleId);
        if (freshQuiz.success) {
          setAttemptHistory(freshQuiz.attempts || []);
        }
      }
    } catch (error) {
      console.error('Error submitting module quiz:', error);
      alert('Failed to submit quiz attempt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER: Quiz Area — spacious, mascot-led, sticky bottom feedback ─────
  const renderQuiz = () => {
    if (questions.length === 0) return null;
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const isCorrect = selectedOption !== null && selectedOption === currentQuestion.options.findIndex(o => o.is_correct);
    const progressPct = ((currentQuestionIndex + (questionRevealed ? 1 : 0)) / totalQuestions) * 100;

    return (
      <>
        {/* Mascot leads the question — big and expressive up top */}
        <View style={s.mascotHero}>
          <Animated.View style={{
            transform: [
              { scale: senyaBounceAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1] }) },
              { translateY: senyaBounceAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -14, 0] }) },
              { rotateZ: senyaShakeAnim.interpolate({ inputRange: [-1, -0.5, 0, 0.5, 1], outputRange: ['-6deg', '-3deg', '0deg', '3deg', '6deg'] }) }
            ]
          }}>
            <Image source={require('../../assets/images/img/senya_teaching.png')} style={s.mascotImage} contentFit="contain" />
          </Animated.View>
        </View>

        {/* Speech-bubble style question card */}
        <View style={s.questionBubble}>
          <View style={s.questionBubbleTail} />
          <Text style={s.questionEyebrow}>QUESTION {currentQuestionIndex + 1}</Text>
          <Text style={s.questionText}>{currentQuestion.question_text}</Text>
        </View>

        {/* Options — roomy spacing */}
        <View style={s.optionsList}>
          {currentQuestion.options.map((opt, i) => {
            const isSel = selectedOption === i;
            const isCorr = i === currentQuestion.options.findIndex(o => o.is_correct);
            let bgColor = '#fff';
            let borderColor = '#EEF2F7';
            let textColor = '#0f3172';
            let circleBg = '#F1F5F9';
            let circleTextColor = '#64748B';

            if (questionRevealed) {
              if (isCorr) { bgColor = '#ECFDF5'; borderColor = '#6EE7B7'; textColor = '#065F46'; circleBg = '#10B981'; }
              else if (isSel) { bgColor = '#FEF2F2'; borderColor = '#FCA5A5'; textColor = '#991B1B'; circleBg = '#EF4444'; }
              else { bgColor = '#fff'; borderColor = '#F1F5F9'; textColor = '#B0B8C4'; circleBg = '#F1F5F9'; }
            } else if (isSel) {
              bgColor = '#EFF6FF'; borderColor = '#93C5FD'; textColor = '#1D4ED8'; circleBg = '#2563EB'; circleTextColor = '#fff';
            }

            return (
              <Pressable
                key={`${currentQuestionIndex}-${i}`}
                style={[s.optionCard, { backgroundColor: bgColor, borderColor }]}
                onPress={() => handleOptionSelect(i)}
                disabled={questionRevealed}
              >
                <View style={[s.optionCircle, { backgroundColor: circleBg }]}>
                  {questionRevealed && isCorr ? <CheckCircleIcon color="#fff" size={17} /> :
                    questionRevealed && isSel && !isCorr ? <XCircleIcon color="#fff" size={17} /> :
                      <Text style={[s.optionLetter, { color: circleTextColor }]}>{String.fromCharCode(65 + i)}</Text>}
                </View>
                <Text style={[s.optionText, { color: textColor }]}>{opt.option_text}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* space so content isn't hidden behind the sticky feedback sheet */}
        <View style={{ height: questionRevealed ? 130 : 20 }} />
      </>
    );
  };

  // ─── RENDER: Results Screen — spaced-out sections ─────────────────────────
  const renderScoreView = () => {
    const score = quizResult?.score || 0;
    const total = quizResult?.total || 0;
    const pct = quizResult?.percentage || 0;
    const xpEarned = quizResult?.xpEarned || 0;
    const stars = pct === 100 ? 3 : pct >= 80 ? 2 : pct >= 50 ? 1 : 0;

    const { label, color, bg } =
      pct === 100 ? { label: 'Perfect Score!', color: '#F59E0B', bg: '#FFFBEB' } :
        pct >= 80 ? { label: 'Excellent!', color: '#10B981', bg: '#ECFDF5' } :
          pct >= 60 ? { label: 'Good Job!', color: '#2563EB', bg: '#EFF6FF' } :
            { label: 'Keep Practicing!', color: '#EF4444', bg: '#FEF2F2' };

    return (
      <Animated.View style={{ opacity: resultsFadeAnim, transform: [{ scale: resultsScaleAnim }] }}>
        {/* Hero */}
        <View style={[s.resultHero, { backgroundColor: bg }]}>
          <Image source={require('../../assets/images/img/senya_teaching.png')} style={s.resultSenya} contentFit="contain" />
          <View style={s.starsRow}>
            {[1, 2, 3].map(i => (
              <Text key={i} style={[s.star, { opacity: i <= stars ? 1 : 0.2 }]}>⭐</Text>
            ))}
          </View>
          <Text style={[s.resultLabel, { color }]}>{label}</Text>
          <Text style={s.scoreDisplay}>{score}<Text style={s.scoreTotal}>/{total}</Text></Text>
          <Text style={s.scoreSubtitle}>correct answers · {pct}%</Text>
          <View style={s.xpEarnedBadge}>
            <Text style={s.xpEarnedText}>⚡ +{xpEarned} XP Earned!</Text>
          </View>
        </View>

        {/* History section — its own breathing room below the hero */}
        <View style={s.historySection}>
          <Pressable style={s.historyToggleBtn} onPress={() => setShowHistory(!showHistory)}>
            <View style={s.historyToggleLeft}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
              <Text style={s.historyToggleText}>Attempt History</Text>
              <View style={s.historyCountBadge}>
                <Text style={s.historyCountText}>{attemptHistory.length}</Text>
              </View>
            </View>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1848c8" strokeWidth="2.5">
              {showHistory ? <Path d="M18 15l-6-6-6 6" /> : <Path d="M6 9l6 6 6-6" />}
            </Svg>
          </Pressable>

          {showHistory && (
            <View style={s.historyList}>
              {attemptHistory.length === 0 ? (
                <Text style={s.historyEmpty}>No previous checkpoint attempts found.</Text>
              ) : (
                attemptHistory.map((attempt, index) => (
                  <View key={index} style={s.historyItem}>
                    <Text style={s.historyItemLabel}>Attempt #{attemptHistory.length - index}</Text>
                    <View style={s.historyItemScore}>
                      <View style={[s.historyChip, { backgroundColor: attempt.percentage >= 60 ? '#ECFDF5' : '#FEF2F2' }]}>
                        <Text style={[s.historyItemScoreText, { color: attempt.percentage >= 60 ? '#10B981' : '#EF4444' }]}>
                          {attempt.percentage}%
                        </Text>
                      </View>
                    </View>
                    <Text style={s.historyItemDate}>
                      {new Date(attempt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Actions — its own section, generously spaced */}
        <View style={s.resultActions}>
          <Pressable style={s.primaryBtn} onPress={() => {
            resultsFadeAnim.setValue(0);
            resultsScaleAnim.setValue(0.85);
            setQuizSubmitted(false);
            setCurrentQuestionIndex(0);
            setSelectedOption(null);
            setQuestionRevealed(false);
            setCurrentScore(0);
            setQuizResult(null);
            setConfettiFired(false);
          }}>
            <Text style={s.primaryBtnText}>↺ Try Checkpoint Again</Text>
          </Pressable>

          <Pressable style={s.ghostBtn} onPress={() => {
            const xpEarnedVal = quizResult?.xpEarned ?? 0;
            const totalXp = quizResult?.totalXp ?? 0;
            const currentLevel = quizResult?.level ?? 1;
            const streakDays = quizResult?.streakDays ?? 0;
            const previousXp = totalXp - xpEarnedVal;

            const levelNameMap: Record<number, string> = {
              1: 'Novice Signer', 2: 'Beginner Signer', 3: 'Emerging Signer',
              4: 'Intermediate Signer', 5: 'Advanced Beginner', 6: 'Competent Signer',
              7: 'Proficient Signer', 8: 'Advanced Signer', 9: 'Expert Signer', 10: 'Master Signer',
            };
            const getNextLevelXp = (level: number): number => {
              const thresholds: Record<number, number> = {
                1: 0, 2: 100, 3: 250, 4: 500, 5: 800,
                6: 1200, 7: 1700, 8: 2300, 9: 3000, 10: 4000,
              };
              return thresholds[level + 1] || 4000 + ((level - 9) * 1000);
            };

            const levelName = levelNameMap[currentLevel] || 'Novice Signer';
            const nextLevelXp = getNextLevelXp(currentLevel);

            setQuizSubmitted(false);
            setCurrentQuestionIndex(0);
            setSelectedOption(null);
            setQuestionRevealed(false);
            setCurrentScore(0);
            setQuizResult(null);
            setConfettiFired(false);

            if (xpEarnedVal > 0) {
              router.push({
                pathname: '/lesson/xp-progress',
                params: {
                  xpEarned: String(xpEarnedVal),
                  totalXp: String(totalXp),
                  level: String(currentLevel),
                  levelName,
                  previousXp: String(previousXp),
                  nextLevelXp: String(nextLevelXp),
                  showStreak: 'true',
                  streakDays: String(streakDays)
                }
              });
            } else {
              router.push({
                pathname: '/lesson/streak',
                params: {
                  streakDays: String(streakDays),
                  xpEarned: String(xpEarnedVal),
                  totalXp: String(totalXp),
                  level: String(currentLevel),
                  levelName
                }
              });
            }
          }}>
            <Text style={s.ghostBtnText}>🏠 Return to Lessons</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  const renderResults = () => {
    return (
      <ScrollView
        ref={resultsScrollRef}
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={s.resultsScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.topBar}>
          <Text style={s.logoText}>SEÑAS</Text>
        </View>
        {renderScoreView()}
      </ScrollView>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  if (loading && questions.length === 0) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <View style={s.loadingInner}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={s.loadingText}>Loading checkpoint...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = !!currentQuestion && selectedOption !== null && selectedOption === currentQuestion.options.findIndex(o => o.is_correct);
  const totalQuestions = questions.length;
  const passed = (quizResult?.percentage || 0) >= 60;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: '#fff' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      {passed && (
        <View style={s.confettiWrapper}>
          <ConfettiCannon
            ref={confettiRef}
            count={160}
            origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
            autoStart={false}
            fadeOut
            explosionSpeed={500}
            fallSpeed={2800}
            colors={['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6FC8', '#845EC2']}
          />
        </View>
      )}

      <ExitModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={handleExit}
      />

      {quizSubmitted ? (
        renderResults()
      ) : (
        <View style={{ flex: 1 }}>
          {/* Fixed header: exit + single progress bar */}
          <View style={s.quizHeader}>
            <View style={s.quizHeaderTopRow}>
              <View>
                <Text style={s.logoText}>SEÑAS</Text>
                <Text style={s.checkpointSubtitle}>{moduleTitle} Checkpoint</Text>
              </View>
              <Pressable style={s.exitBtn} onPress={() => setShowExitModal(true)}>
                <CloseIcon size={15} color="#6B7280" />
              </Pressable>
            </View>

            <View style={s.progressTrackWrap}>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${((currentQuestionIndex + (questionRevealed ? 1 : 0)) / (totalQuestions || 1)) * 100}%` }]} />
              </View>
              <Text style={s.progressCountText}>{currentQuestionIndex + 1}/{totalQuestions}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.quizScroll} showsVerticalScrollIndicator={false}>
            {renderQuiz()}
          </ScrollView>

          {/* Sticky bottom feedback sheet — slides up on answer, holds Next button */}
          {questionRevealed && (
            <Animated.View
              style={[
                s.feedbackSheet,
                isCorrect ? s.feedbackSheetCorrect : s.feedbackSheetWrong,
                {
                  transform: [{
                    translateY: feedbackSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [140, 0] })
                  }]
                }
              ]}
            >
              <View style={s.feedbackSheetTop}>
                <View style={[s.feedbackIconCircle, { backgroundColor: isCorrect ? '#10B981' : '#EF4444' }]}>
                  {isCorrect ? <CheckCircleIcon color="#fff" size={20} /> : <XCircleIcon color="#fff" size={20} />}
                </View>
                <Text style={[s.feedbackSheetText, { color: isCorrect ? '#065F46' : '#991B1B' }]}>
                  {isCorrect ? 'Correct! Great job 🎉' : 'Not quite — keep going 😅'}
                </Text>
              </View>
              <Pressable
                style={[s.feedbackNextBtn, { backgroundColor: isCorrect ? '#10B981' : '#2563EB' }]}
                onPress={handleNextQuestion}
              >
                <Text style={s.feedbackNextBtnText}>
                  {currentQuestionIndex < totalQuestions - 1 ? 'Next' : 'Results'}
                </Text>
                <ArrowRightIcon size={16} />
              </Pressable>
            </Animated.View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  confettiWrapper: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999, pointerEvents: 'none', elevation: 9999
  },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  loadingInner: { alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, fontWeight: '600', color: '#4B7FCC' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },

  // Exit Modal
  exitModal: { width: '88%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 28, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.18, shadowRadius: 48, elevation: 24 },
  exitIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  exitTitle: { fontSize: 20, fontWeight: '800', color: '#0f3172', marginBottom: 8 },
  exitDesc: { fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 20, marginBottom: 24, textAlign: 'center' },
  exitBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  stayBtn: { flex: 1, paddingVertical: 13, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 40, alignItems: 'center' },
  stayText: { fontSize: 14, fontWeight: '700', color: '#0f3172' },
  exitConfirmBtn: { flex: 1.3, paddingVertical: 13, backgroundColor: '#DC2626', borderRadius: 40, alignItems: 'center', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  exitConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Fixed quiz header
  quizHeader: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  quizHeaderTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  logoText: { color: '#0f3172', fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  checkpointSubtitle: { color: '#4b7bbb', fontSize: 12, fontWeight: '600', marginTop: 2 },
  exitBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  progressTrackWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 10, backgroundColor: '#F1F5F9', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 99 },
  progressCountText: { fontSize: 12, fontWeight: '800', color: '#64748B', minWidth: 32, textAlign: 'right' },

  quizScroll: { padding: 20, paddingTop: 24 },

  // Mascot hero
  mascotHero: { alignItems: 'center', marginBottom: 14 },
  mascotImage: { width: 110, height: 110 },

  // Speech-bubble question card
  questionBubble: {
    backgroundColor: '#EFF6FF', borderRadius: 24, padding: 22,
    marginBottom: 22, position: 'relative',
  },
  questionBubbleTail: {
    position: 'absolute', top: -10, alignSelf: 'center',
    width: 20, height: 20, backgroundColor: '#EFF6FF',
    transform: [{ rotate: '45deg' }],
  },
  questionEyebrow: { fontSize: 11, fontWeight: '800', color: '#2563EB', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  questionText: { fontSize: 17, fontWeight: '800', color: '#0f3172', textAlign: 'center', lineHeight: 25 },

  // Options — generous spacing
  optionsList: { gap: 12 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderRadius: 18, padding: 16 },
  optionCircle: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionLetter: { fontSize: 14, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 21 },

  // Sticky bottom feedback sheet
  feedbackSheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: '#0f3172', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12,
  },
  feedbackSheetCorrect: { backgroundColor: '#ECFDF5' },
  feedbackSheetWrong: { backgroundColor: '#FEF2F2' },
  feedbackSheetTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  feedbackIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  feedbackSheetText: { fontSize: 15, fontWeight: '800', flex: 1 },
  feedbackNextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 60, paddingVertical: 15 },
  feedbackNextBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Results
  resultsScroll: { padding: 20, paddingBottom: 60 },
  topBar: { marginBottom: 18 },

  resultHero: { borderRadius: 28, padding: 28, alignItems: 'center' },
  resultSenya: { width: 90, height: 90, marginBottom: 6 },
  starsRow: { flexDirection: 'row', gap: 4, marginVertical: 8 },
  star: { fontSize: 30 },
  resultLabel: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  scoreDisplay: { fontSize: 60, fontWeight: '900', color: '#0f3172', lineHeight: 68 },
  scoreTotal: { fontSize: 26, opacity: 0.45 },
  scoreSubtitle: { fontSize: 14, color: '#6B7280', fontWeight: '500', marginBottom: 14 },
  xpEarnedBadge: { backgroundColor: 'rgba(245,158,11,0.18)', borderRadius: 99, paddingVertical: 8, paddingHorizontal: 20 },
  xpEarnedText: { fontSize: 14, fontWeight: '800', color: '#92400E' },

  historySection: { marginTop: 24 },
  historyToggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#EFF6FF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18,
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  historyToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyToggleText: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  historyCountBadge: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  historyCountText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  historyList: { backgroundColor: '#fff', borderRadius: 16, padding: 6, marginTop: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  historyEmpty: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  historyItemLabel: { fontSize: 13, fontWeight: '600', color: '#0f3172' },
  historyItemScore: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyChip: { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  historyItemScoreText: { fontSize: 13, fontWeight: '800' },
  historyItemDate: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

  resultActions: { marginTop: 28, gap: 12 },
  primaryBtn: { backgroundColor: '#1848c8', borderRadius: 60, paddingVertical: 16, alignItems: 'center', shadowColor: '#1848c8', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 10 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ghostBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 60, paddingVertical: 16, alignItems: 'center' },
  ghostBtnText: { fontSize: 15, fontWeight: '700', color: '#0f3172' },
});