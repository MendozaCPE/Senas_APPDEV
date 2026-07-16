// app/module-quiz/[id].tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable,
  ScrollView, Modal, ActivityIndicator, Animated, Dimensions, StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Audio } from 'expo-av';
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
function CheckCircleIcon({ color = '#10B981' }: { color?: string }) {
  return <Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><Polyline points="8 12 11 15 16 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
function XCircleIcon({ color = '#EF4444' }: { color?: string }) {
  return <Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></Svg>;
}
function BookIcon({ size = 16, color = '#1848c8' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><Path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" /><Path d="M8 2v4" /><Path d="M16 2v4" /></Svg>;
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

  // ── Audio state ──
  const [correctSound, setCorrectSound] = useState<Audio.Sound | null>(null);
  const [wrongSound, setWrongSound] = useState<Audio.Sound | null>(null);
  const [resultSound, setResultSound] = useState<Audio.Sound | null>(null);
  const [isSoundPlaying, setIsSoundPlaying] = useState<boolean>(false);

  // ── Play correct answer sound ──
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

  // ── Play wrong answer sound ──
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

  // ── Play quiz result sound ──
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

  // ── Load Quiz Data ──
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

  // Results screen transitions
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
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setQuestionRevealed(false);
    } else {
      submitQuiz();
    }
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
        // Refresh attempts
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

  // ─── RENDER: Quiz Quiz Area ───────────────────────────────────────────────
  const renderQuiz = () => {
    if (questions.length === 0) return null;
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const isCorrect = selectedOption !== null && selectedOption === currentQuestion.options.findIndex(o => o.is_correct);

    return (
      <>
        <View style={s.glassCard}>
          <View style={s.progressHeader}>
            <Text style={s.progressLabel}>Question {currentQuestionIndex + 1} of {totalQuestions}</Text>
          </View>
          <View style={s.progressDots}>
            {questions.map((_, i) => (
              <View key={i} style={[s.progressDot, {
                backgroundColor: i < currentQuestionIndex ? '#22c55e' :
                  i === currentQuestionIndex ? '#2563EB' : 'rgba(15,49,114,0.10)'
              }]} />
            ))}
          </View>
        </View>

        <View style={[s.glassCard, s.questionCard]}>
          <Text style={s.questionEmojiSmall}>❓</Text>
          <Text style={s.questionText}>{currentQuestion.question_text}</Text>
        </View>

        {currentQuestion.options.map((opt, i) => {
          const isSel = selectedOption === i;
          const isCorr = i === currentQuestion.options.findIndex(o => o.is_correct);
          let bgColor = 'rgba(255,255,255,0.62)';
          let borderColor = 'rgba(255,255,255,0.85)';
          let textColor = '#0f3172';
          let circleBg = 'rgba(15,49,114,0.08)';

          if (questionRevealed) {
            if (isCorr) { bgColor = 'rgba(236,253,245,0.9)'; borderColor = '#6EE7B7'; textColor = '#065F46'; circleBg = '#10B981'; }
            else if (isSel) { bgColor = 'rgba(254,242,242,0.9)'; borderColor = '#FCA5A5'; textColor = '#991B1B'; circleBg = '#EF4444'; }
            else { bgColor = 'rgba(255,255,255,0.35)'; textColor = '#9CA3AF'; }
          } else if (isSel) {
            bgColor = 'rgba(239,246,255,0.9)'; borderColor = '#93C5FD'; textColor = '#1D4ED8'; circleBg = '#2563EB';
          }

          return (
            <Pressable key={`${currentQuestionIndex}-${i}`} style={[s.optionCard, { backgroundColor: bgColor, borderColor }]}
              onPress={() => handleOptionSelect(i)} disabled={questionRevealed}>
              <View style={[s.optionCircle, { backgroundColor: circleBg }]}>
                {questionRevealed && isCorr ? <CheckCircleIcon color="#fff" /> :
                  questionRevealed && isSel && !isCorr ? <XCircleIcon color="#fff" /> :
                    <Text style={[s.optionLetter, { color: isSel ? '#fff' : '#4b7bbb' }]}>{String.fromCharCode(65 + i)}</Text>}
              </View>
              <Text style={[s.optionText, { color: textColor }]}>{opt.option_text}</Text>
            </Pressable>
          );
        })}

        <View style={s.feedbackRow}>
          <Animated.View style={{
            transform: [
              { scale: senyaBounceAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] }) },
              { translateY: senyaBounceAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -20, 0] }) },
              { rotateZ: senyaShakeAnim.interpolate({ inputRange: [-1, -0.5, 0, 0.5, 1], outputRange: ['-6deg', '-3deg', '0deg', '3deg', '6deg'] }) }
            ]
          }}>
            <Image source={require('../../assets/images/img/senya_teaching.png')} style={s.senyaFeedback} contentFit="contain" />
          </Animated.View>
          <View style={[s.feedbackBubble, questionRevealed && isCorrect ? s.feedbackCorrect : questionRevealed && !isCorrect ? s.feedbackWrong : {}]}>
            {questionRevealed && isCorrect && <CheckCircleIcon />}
            {questionRevealed && !isCorrect && <XCircleIcon />}
            <Text style={[s.feedbackText, questionRevealed && isCorrect ? { color: '#065f46' } : questionRevealed ? { color: '#991b1b' } : {}]}>
              {questionRevealed
                ? (isCorrect ? 'Correct! 🎉' : 'Incorrect! 😅')
                : 'Read carefully and pick the best answer!'}
            </Text>
          </View>
        </View>

        {questionRevealed && (
          <Pressable style={[s.primaryBtn, isCorrect && s.goldBtn]} onPress={handleNextQuestion}>
            <Text style={s.primaryBtnText}>
              {currentQuestionIndex < totalQuestions - 1 ? 'Next Question →' : 'See Results →'}
            </Text>
          </Pressable>
        )}
      </>
    );
  };

  // ─── RENDER: Results Screen ───────────────────────────────────────────────
  const renderScoreView = () => {
    const score = quizResult?.score || 0;
    const total = quizResult?.total || 0;
    const pct = quizResult?.percentage || 0;
    const xpEarned = quizResult?.xpEarned || 0;
    const stars = pct === 100 ? 3 : pct >= 80 ? 2 : pct >= 50 ? 1 : 0;

    const { label, color } =
      pct === 100 ? { label: 'Perfect Score!', color: '#F59E0B' } :
        pct >= 80 ? { label: 'Excellent!', color: '#10B981' } :
          pct >= 60 ? { label: 'Good Job!', color: '#2563EB' } :
            { label: 'Keep Practicing!', color: '#EF4444' };

    return (
      <Animated.View style={[s.resultsContainer, {
        opacity: resultsFadeAnim,
        transform: [{ scale: resultsScaleAnim }],
      }]}>
        <View style={[s.glassCard, { alignItems: 'center', paddingVertical: 28 }]}>
          <Image source={require('../../assets/images/img/senya_teaching.png')} style={s.resultSenya} contentFit="contain" />
          <Text style={{ fontSize: 40, marginBottom: 4 }}>🏆</Text>
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

        {/* Attempt History */}
        <Pressable style={s.historyToggleBtn} onPress={() => setShowHistory(!showHistory)}>
          <View style={s.historyToggleLeft}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round">
              <Circle cx="12" cy="12" r="10" />
              <Path d="M12 6v6l4 2" />
            </Svg>
            <Text style={s.historyToggleText}>Checkpoint Attempt History</Text>
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
                    <Text style={[s.historyItemScoreText, { color: attempt.percentage >= 60 ? '#10B981' : '#EF4444' }]}>
                      {attempt.percentage}%
                    </Text>
                    <Text style={s.historyItemStatus}>
                      {attempt.percentage >= 60 ? '✅ Passed' : '❌ Failed'}
                    </Text>
                  </View>
                  <Text style={s.historyItemDate}>
                    {new Date(attempt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Action buttons */}
        <Pressable style={[s.primaryBtn, { marginTop: 16 }]} onPress={() => {
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

        <Pressable style={[s.ghostBtn, { marginTop: 10, flex: 0 }]} onPress={() => {
          const xpEarned = quizResult?.xpEarned ?? 0;
          const totalXp = quizResult?.totalXp ?? 0;
          const currentLevel = quizResult?.level ?? 1;
          const streakDays = quizResult?.streakDays ?? 0;
          const previousXp = totalXp - xpEarned;

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

          if (xpEarned > 0) {
            router.push({
              pathname: '/lesson/xp-progress',
              params: {
                xpEarned: String(xpEarned),
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
                xpEarned: String(xpEarned),
                totalXp: String(totalXp),
                level: String(currentLevel),
                levelName
              }
            });
          }
        }}>
          <Text style={s.ghostBtnText}>🏠 Return to Lessons</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderResults = () => {
    return (
      <ScrollView
        ref={resultsScrollRef}
        style={{ flex: 1, backgroundColor: '#eaf5fd' }}
        contentContainerStyle={[s.moduleScroll, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.topBar, { paddingHorizontal: 0 }]}>
          <Text style={s.logoText}>SEÑAS</Text>
        </View>
        {renderScoreView()}
      </ScrollView>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER MAIN CONTAINER
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

  const passed = (quizResult?.percentage || 0) >= 60;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: '#eaf5fd' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#eaf5fd" translucent={false} />

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
        <ScrollView contentContainerStyle={s.moduleScroll} showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <View>
              <Text style={s.logoText}>SEÑAS</Text>
              <Text style={s.checkpointSubtitle}>{moduleTitle} Checkpoint</Text>
            </View>
            <Pressable style={s.exitBtn} onPress={() => setShowExitModal(true)}>
              <Text style={s.exitBtnText}>✕ Exit</Text>
            </Pressable>
          </View>
          {renderQuiz()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  questionEmojiSmall: { fontSize: 28, marginBottom: 8 },

  // Confetti
  confettiWrapper: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999, pointerEvents: 'none', elevation: 9999
  },

  // Loading / Error
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaf5fd' },
  loadingInner: { alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, fontWeight: '600', color: '#4B7FCC' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },

  // Exit Modal
  exitModal: { width: '88%', maxWidth: 340, backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 28, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.18, shadowRadius: 48, elevation: 24 },
  exitIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  exitTitle: { fontSize: 20, fontWeight: '800', color: '#0f3172', marginBottom: 8 },
  exitDesc: { fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 20, marginBottom: 24, textAlign: 'center' },
  exitBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  stayBtn: { flex: 1, paddingVertical: 13, backgroundColor: 'rgba(15,49,114,0.07)', borderWidth: 1, borderColor: 'rgba(15,49,114,0.10)', borderRadius: 40, alignItems: 'center' },
  stayText: { fontSize: 14, fontWeight: '700', color: '#0f3172' },
  exitConfirmBtn: { flex: 1.3, paddingVertical: 13, backgroundColor: '#DC2626', borderRadius: 40, alignItems: 'center', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  exitConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Layout
  moduleScroll: { padding: 16, paddingBottom: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  logoText: { color: '#0f3172', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  checkpointSubtitle: { color: '#4b7bbb', fontSize: 12, fontWeight: '600', marginTop: 2 },
  exitBtn: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' },
  exitBtnText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },

  // Cards
  glassCard: { backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: '#0f3172', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 12, elevation: 4 },
  primaryBtn: { flex: 1, backgroundColor: '#1848c8', borderRadius: 60, paddingVertical: 14, alignItems: 'center', shadowColor: '#1848c8', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 10 },
  goldBtn: { backgroundColor: '#D97706' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ghostBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', borderRadius: 60, paddingVertical: 14, alignItems: 'center' },
  ghostBtnText: { fontSize: 15, fontWeight: '700', color: '#0f3172' },

  // ProgressDots
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: '#0f3172' },
  progressDots: { flexDirection: 'row', gap: 4 },
  progressDot: { flex: 1, height: 5, borderRadius: 99 },

  // Question Area
  questionCard: { alignItems: 'center', paddingVertical: 24 },
  questionText: { fontSize: 16, fontWeight: '800', color: '#0f3172', textAlign: 'center', lineHeight: 24 },

  // Option Cards
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 13, marginBottom: 8 },
  optionCircle: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionLetter: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  // Feedback Bubble
  feedbackRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginVertical: 12 },
  senyaFeedback: { width: 80, height: 80, flexShrink: 0 },
  feedbackBubble: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 12 },
  feedbackCorrect: { backgroundColor: 'rgba(236,253,245,0.88)', borderColor: '#a7f3d0' },
  feedbackWrong: { backgroundColor: 'rgba(254,242,242,0.88)', borderColor: '#fecaca' },
  feedbackText: { flex: 1, fontSize: 12.5, fontWeight: '500', color: '#0f3172', lineHeight: 18 },

  // Results styling
  resultsContainer: { gap: 4 },
  resultSenya: { width: 90, height: 90, marginBottom: 8 },
  starsRow: { flexDirection: 'row', gap: 4, marginVertical: 6 },
  star: { fontSize: 28 },
  resultLabel: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  scoreDisplay: { fontSize: 64, fontWeight: '900', color: '#0f3172', lineHeight: 72 },
  scoreTotal: { fontSize: 28, opacity: 0.5 },
  scoreSubtitle: { fontSize: 14, color: '#6B7280', fontWeight: '500', marginBottom: 12 },
  xpEarnedBadge: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 99, paddingVertical: 6, paddingHorizontal: 18 },
  xpEarnedText: { fontSize: 14, fontWeight: '800', color: '#92400E' },

  // Attempts History list in results
  historyToggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#EFF6FF', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  historyToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyToggleText: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  historyCountBadge: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  historyCountText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  historyList: { backgroundColor: 'rgba(255,255,255,0.62)', borderRadius: 14, padding: 12, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' },
  historyEmpty: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(15,49,114,0.06)' },
  historyItemLabel: { fontSize: 13, fontWeight: '600', color: '#0f3172' },
  historyItemScore: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyItemScoreText: { fontSize: 14, fontWeight: '800' },
  historyItemStatus: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  historyItemDate: { fontSize: 10, color: '#9CA3AF' },
});