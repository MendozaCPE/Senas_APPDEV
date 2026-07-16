// app/lesson/[id].tsx
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Circle, Defs, Line, Path, Polyline, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Brand gradient — same family as the dashboard hero card, kept uniform ──
const BRAND_GRADIENT = ['#0d326b', '#1e4b8f', '#1a6fd4'] as const;

// ─── Colors for slides / stones / stickers ─────────────────────────────────
const SLIDE_COLORS = [
  '#2563EB', // Blue
  '#059669', // Green
  '#D97706', // Amber
  '#7C3AED', // Purple
  '#DC2626', // Red
  '#0891B2', // Cyan
  '#C026D3', // Fuchsia
  '#EA580C', // Orange
  '#4F46E5', // Indigo
  '#0D9488', // Teal
];

// ─── SOUND EFFECTS ──────────────────────────────────────────────────────────
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
  question_number: number;
  question_type: string;
  question_text: string;
  media_url: string | null;
  points: number;
  options: Option[];
}
interface Quiz {
  quiz_id: number;
  title: string;
  description: string;
  total_points: number;
  passing_score: number;
  questions: Question[];
}
interface Content {
  content_id: number;
  step_number: number;
  content_type: string;
  title: string;
  content_text: string;
  media_url: string | null;
  gesture_name: string | null;
}
interface Lesson {
  lesson_id: number;
  title: string;
  description: string;
  lesson_type: string;
  difficulty: string;
  status: string;
  contents: Content[];
  quiz: Quiz | null;
  total_steps: number;
  assignment_status: string;
  progress: {
    current_step: number;
    lesson_completed: boolean;
    quiz_completed: boolean;
    quiz_score: number | null;
  } | null;
}
interface QuizAnswer {
  question_id: number;
  selected_option_id: number | null;
  is_correct: boolean;
}
interface LeaderboardEntry {
  rank: number;
  student_id: number;
  name: string;
  username: string;
  best_score: number;
  attempts: number;
  attempts_to_achieve?: number;
  is_me: boolean;
  initials: string;
  xp_earned: number;
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────
function CheckCircleIcon({ color = '#10B981', size = 18 }: { color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><Polyline points="8 12 11 15 16 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
function XCircleIcon({ color = '#EF4444', size = 18 }: { color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></Svg>;
}
function StarBurstIcon({ size = 22, color = '#FBBF24' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.2 5.6L20 9l-4.6 3.8L16.8 19 12 15.7 7.2 19l1.4-6.2L4 9l5.8-1.4L12 2z" />
    </Svg>
  );
}
function HomeIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" /></Svg>;
}
function RefreshIcon({ size = 15, color = '#2563EB' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><Path d="M23 4v6h-6" /><Path d="M1 20v-6h6" /><Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></Svg>;
}
function BookIcon({ size = 16, color = '#1848c8' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><Path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" /><Path d="M8 2v4" /><Path d="M16 2v4" /></Svg>;
}
function ArrowLeftIcon({ size = 18, color = '#0f3172' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><Path d="M19 12H5M12 19l-7-7 7-7" /></Svg>;
}
function ArrowRightIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12h14M12 5l7 7-7 7" /></Svg>;
}
function LockIcon({ size = 14, color = '#94A3B8' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><Rect x="3" y="11" width="18" height="11" rx="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>;
}
function CloseIcon({ size = 20, color = '#6B7280' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><Path d="M18 6L6 18M6 6l12 12" /></Svg>;
}

interface PodiumBlockProps {
  rank: number;
  height: number;
  width: number;
}

function Podium3DBlock({ rank, height, width }: PodiumBlockProps) {
  const dy = rank === 1 ? 12 : 10;
  const w = width;
  const h = height;

  let topColors = ['#FFFBEB', '#FDE68A'];
  let leftColors = ['#FBBF24', '#D97706'];
  let rightColors = ['#D97706', '#B45309'];
  let glowColor = '#FBBF24';

  if (rank === 2) {
    topColors = ['#F8FAFC', '#CBD5E1'];
    leftColors = ['#94A3B8', '#64748B'];
    rightColors = ['#64748B', '#475569'];
    glowColor = '#94A3B8';
  } else if (rank === 3) {
    topColors = ['#FFEDD5', '#FED7AA'];
    leftColors = ['#F97316', '#C2410C'];
    rightColors = ['#C2410C', '#9A3412'];
    glowColor = '#F97316';
  }

  const gradTopId = `gradTop-${rank}`;
  const gradLeftId = `gradLeft-${rank}`;
  const gradRightId = `gradRight-${rank}`;

  return (
    <View style={{
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.75,
      shadowRadius: 12,
      elevation: 10,
      alignItems: 'center',
    }}>
      <Svg width={w} height={h + 2 * dy} viewBox={`0 0 ${w} ${h + 2 * dy}`}>
        <Defs>
          <SvgLinearGradient id={gradTopId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={topColors[0]} />
            <Stop offset="100%" stopColor={topColors[1]} />
          </SvgLinearGradient>
          <SvgLinearGradient id={gradLeftId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={leftColors[0]} />
            <Stop offset="100%" stopColor={leftColors[1]} />
          </SvgLinearGradient>
          <SvgLinearGradient id={gradRightId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={rightColors[0]} />
            <Stop offset="100%" stopColor={rightColors[1]} />
          </SvgLinearGradient>
        </Defs>
        <Path d={`M 0 ${dy} L ${w / 2} ${2 * dy} L ${w / 2} ${h + 2 * dy} L 0 ${h + dy} Z`} fill={`url(#${gradLeftId})`} />
        <Path d={`M ${w / 2} ${2 * dy} L ${w} ${dy} L ${w} ${h + dy} L ${w / 2} ${h + 2 * dy} Z`} fill={`url(#${gradRightId})`} />
        <Path d={`M 0 ${dy} L ${w / 2} 0 L ${w} ${dy} L ${w / 2} ${2 * dy} Z`} fill={`url(#${gradTopId})`} />
        <Path d={`M 0 ${dy} L ${w / 2} ${2 * dy} L ${w} ${dy} L ${w / 2} 0 Z`} stroke={glowColor} strokeWidth="1.5" fill="none" opacity="0.95" />
        <Path d={`M 0 ${dy} L 0 ${h + dy} L ${w / 2} ${h + 2 * dy} L ${w} ${h + dy} L ${w} ${dy}`} stroke={glowColor} strokeWidth="1.5" fill="none" opacity="0.8" />
        <Path d={`M ${w / 2} ${2 * dy} L ${w / 2} ${h + 2 * dy}`} stroke={glowColor} strokeWidth="1.5" fill="none" opacity="0.8" />
      </Svg>
      <View style={{
        position: 'absolute',
        top: dy + (h / 3) - 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          fontSize: rank === 1 ? 34 : 26,
          fontWeight: '900',
          color: '#fff',
          textShadowColor: 'rgba(0,0,0,0.3)',
          textShadowOffset: { width: 1.5, height: 1.5 },
          textShadowRadius: 3,
        }}>
          {rank}
        </Text>
      </View>
    </View>
  );
}

// ─── Bouncy pressable — every tap gets a satisfying little "squish" ─────────
function Bouncy({ children, onPress, style, disabled, hitSlop }: {
  children: React.ReactNode; onPress?: () => void; style?: any; disabled?: boolean; hitSlop?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 10 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 14 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled} hitSlop={hitSlop}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Drifting cloud puffs — same motif family as the dashboard hero ────────
function CloudPuffs({ cw, ch }: { cw: number; ch: number }) {
  const w = '#ffffff';
  return (
    <>
      <View style={{ position: 'absolute', bottom: 0, left: cw * 0.08, width: cw * 0.5, height: ch * 0.72, borderRadius: 999, backgroundColor: w }} />
      <View style={{ position: 'absolute', bottom: 0, left: cw * 0.35, width: cw * 0.6, height: ch * 0.88, borderRadius: 999, backgroundColor: w }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw, height: ch * 0.52, borderRadius: 999, backgroundColor: w }} />
    </>
  );
}
function DriftingCloud({ top, size = 1, duration = 18000, startX = 0, opacity = 0.16, trackWidth }: {
  top: number; size?: number; duration?: number; startX?: number; opacity?: number; trackWidth: number;
}) {
  const translateX = useRef(new Animated.Value(startX)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: trackWidth + trackWidth * 0.5,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const cw = 70 * size, ch = 26 * size;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top, left: -trackWidth * 0.5, opacity, transform: [{ translateX }] }}>
      <View style={{ width: cw, height: ch * 1.1 }}><CloudPuffs cw={cw} ch={ch} /></View>
    </Animated.View>
  );
}

// ─── Adventure Path — the signature progress element ───────────────────────
// A winding trail of stepping stones (used for both lesson slides and quiz
// questions) so the child always sees "how far along the journey" they are.
function AdventurePath({
  count, current, color, onStonePress, completedColor = '#22c55e',
}: {
  count: number; current: number; color: string; onStonePress?: (i: number) => void; completedColor?: string;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [current]);

  return (
    <View style={s.pathWrap}>
      <View style={s.pathTrack} />
      <View style={s.pathRow}>
        {Array.from({ length: count }).map((_, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const wobble = i % 2 === 0 ? -6 : 6;
          const stoneColor = done ? completedColor : isCurrent ? color : '#E2E8F0';
          const Stone = (
            <Animated.View
              style={[
                s.pathStone,
                {
                  backgroundColor: stoneColor,
                  marginTop: isCurrent ? 0 : wobble,
                  transform: [{ scale: isCurrent ? pulse : 1 }],
                },
                isCurrent && { shadowColor: color, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
              ]}
            >
              {done ? (
                <CheckCircleIcon color="#fff" size={14} />
              ) : (
                <Text style={[s.pathStoneText, { color: isCurrent ? '#fff' : '#94A3B8' }]}>{i + 1}</Text>
              )}
            </Animated.View>
          );
          return onStonePress ? (
            <Pressable key={i} onPress={() => onStonePress(i)} style={s.pathStoneTouchable}>
              {Stone}
            </Pressable>
          ) : (
            <View key={i} style={s.pathStoneTouchable}>{Stone}</View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Sticker badge — a little rotated "stamp" used across cards ────────────
function StickerBadge({ label, color, rotate = -6 }: { label: string; color: string; rotate?: number }) {
  return (
    <View style={[s.stickerBadge, { backgroundColor: color, transform: [{ rotate: `${rotate}deg` }] }]}>
      <Text style={s.stickerBadgeText}>{label}</Text>
    </View>
  );
}

// ─── Exit Modal ──────────────────────────────────────────────────────────────
function ExitModal({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.exitModal} onPress={e => e.stopPropagation()}>
          <Text style={s.exitEmoji}>🚪</Text>
          <Text style={s.exitTitle}>Leaving so soon?</Text>
          <Text style={s.exitDesc}>No worries — we'll save your spot on the path!</Text>
          <View style={s.exitBtns}>
            <Bouncy style={s.stayBtn} onPress={onClose}>
              <Text style={s.stayText}>Keep Going</Text>
            </Bouncy>
            <Bouncy style={s.exitConfirmBtn} onPress={onConfirm}>
              <Text style={s.exitConfirmText}>Exit</Text>
            </Bouncy>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Student Detail Modal ──────────────────────────────────────────────────
function StudentDetailModal({
  visible, onClose, student,
}: { visible: boolean; onClose: () => void; student: LeaderboardEntry | null }) {
  if (!student) return null;
  const rankEmoji = student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : `#${student.rank}`;
  const isPerfect = student.best_score === 100;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.studentDetailModal} onPress={e => e.stopPropagation()}>
          <Pressable style={s.studentDetailClose} onPress={onClose}>
            <CloseIcon />
          </Pressable>

          <View style={[s.studentDetailAvatar, student.is_me && s.studentDetailAvatarMe]}>
            <Text style={s.studentDetailAvatarText}>{student.initials}</Text>
          </View>

          <Text style={s.studentDetailName}>{student.is_me ? 'You' : student.name}</Text>
          <Text style={s.studentDetailUsername}>@{student.username}</Text>

          <View style={s.studentDetailDivider} />

          <View style={s.studentDetailStats}>
            <View style={s.studentDetailStat}>
              <Text style={s.studentDetailStatLabel}>Rank</Text>
              <Text style={s.studentDetailStatValue}>{rankEmoji}</Text>
            </View>
            <View style={s.studentDetailStatDivider} />
            <View style={s.studentDetailStat}>
              <Text style={s.studentDetailStatLabel}>Best Score</Text>
              <Text style={[s.studentDetailStatValue, isPerfect && { color: '#F59E0B' }]}>{student.best_score}%</Text>
            </View>
            <View style={s.studentDetailStatDivider} />
            <View style={s.studentDetailStat}>
              <Text style={s.studentDetailStatLabel}>Attempts</Text>
              <Text style={s.studentDetailStatValue}>{student.attempts_to_achieve || student.attempts}</Text>
            </View>
          </View>

          <View style={s.studentDetailNote}>
            <Text style={s.studentDetailNoteText}>
              {student.attempts_to_achieve === 1
                ? '🏆 Nailed it on the very first try!'
                : student.attempts_to_achieve && student.attempts_to_achieve <= 3
                  ? `⭐ Got there in just ${student.attempts_to_achieve} tries!`
                  : `📈 Got there after ${student.attempts_to_achieve || student.attempts} tries`}
            </Text>
          </View>

          <Bouncy style={s.studentDetailBtn} onPress={onClose}>
            <Text style={s.studentDetailBtnText}>Close</Text>
          </Bouncy>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LessonViewer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<{
    score: number; total: number; percentage: number;
    xpEarned: number; totalXp: number; level: number; streakDays: number;
  } | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [attemptHistory, setAttemptHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);
  const confettiRef = useRef<any>(null);
  const resultsFadeAnim = useRef(new Animated.Value(0)).current;
  const resultsScaleAnim = useRef(new Animated.Value(0.85)).current;
  // Parallax scroll: score view drifts/fades as leaderboard sheet rises over it
  const parallelScrollY = useRef(new Animated.Value(0)).current;
  const resultsScrollRef = useRef<any>(null);

  // ── Audio state ──
  const [correctSound, setCorrectSound] = useState<Audio.Sound | null>(null);
  const [wrongSound, setWrongSound] = useState<Audio.Sound | null>(null);
  const [resultSound, setResultSound] = useState<Audio.Sound | null>(null);
  const [isSoundPlaying, setIsSoundPlaying] = useState<boolean>(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Student detail modal state
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState<boolean>(false);

  // Quiz state for step-by-step
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionRevealed, setQuestionRevealed] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<number>(0);

  const senyaBounceAnim = useRef(new Animated.Value(0)).current; // 0 = normal, 1 = bounce
  const senyaShakeAnim = useRef(new Animated.Value(0)).current; // 0 = normal, 1 = shake

  // ── Play correct answer sound ──
  async function playCorrectSound() {
    try {
      if (isSoundPlaying) return;
      setIsSoundPlaying(true);

      if (correctSound) {
        await correctSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        CORRECT_SOUND,
        {
          shouldPlay: true,
          isLooping: false,
          volume: 0.9, // Louder for correct answers (90%)
        }
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

      if (wrongSound) {
        await wrongSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        WRONG_SOUND,
        {
          shouldPlay: true,
          isLooping: false,
          volume: 0.6, // Lower for wrong answers (60%)
        }
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
      if (resultSound) {
        await resultSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        QUIZ_RESULT_SOUND,
        {
          shouldPlay: true,
          isLooping: false,
          volume: 0.8,
        }
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
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const animateSenyaIncorrect = () => {
    // Reset and shake - gentler, more playful
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

  const fetchAttemptHistory = async () => {
    try {
      const response = await api.getAttempts(id);
      if (response.success) setAttemptHistory(response.attempts);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const response = await api.getLessonLeaderboard(id);
      if (response.success) {
        setLeaderboard(response.rankings);
        setUserRank(response.user_rank);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchLesson = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.getLessonById(id);
      if (response.success) {
        setLesson(response.lesson);
        if (response.lesson.progress) {
          setCurrentSlide(response.lesson.progress.current_step || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      alert('Failed to load lesson. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
    fetchAttemptHistory();
    fetchLeaderboard();

    // ── Cleanup sounds on unmount ──
    return () => {
      if (correctSound) {
        correctSound.unloadAsync();
      }
      if (wrongSound) {
        wrongSound.unloadAsync();
      }
      if (resultSound) {
        resultSound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (quizSubmitted && quizResult) {
      // ── Play result sound ──
      playResultSound();

      // Reset animation values BEFORE starting new animation
      resultsFadeAnim.setValue(0);
      resultsScaleAnim.setValue(0.85);

      // Start the animation
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
      // Refresh leaderboard after quiz
      fetchLeaderboard();
    }
  }, [quizSubmitted, quizResult]);


  const updateProgress = async (step: number, completed: boolean = false): Promise<void> => {
    try {
      await api.updateLessonProgress(id, { current_step: step, lesson_completed: completed });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleSlideChange = async (newSlide: number): Promise<void> => {
    setCurrentSlide(newSlide);
    if (lesson && newSlide < lesson.contents.length) {
      try { await api.awardSlideXp(id, newSlide); }
      catch (error) { console.error('Error awarding slide XP:', error); }
    }
    await updateProgress(newSlide);
  };

  const handleExit = () => {
    setShowExitModal(false);
    router.dismiss();
  };

  const handleOptionSelect = async (optionIndex: number) => {
    if (questionRevealed) return;
    setSelectedOption(optionIndex);
    setQuestionRevealed(true);

    const questions = lesson?.quiz?.questions || [];
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQ?.options.findIndex(o => o.is_correct);

    // ── Play the appropriate sound ──
    if (isCorrect) {
      await playCorrectSound();
      animateSenyaCorrect();
    } else {
      await playWrongSound();
      animateSenyaIncorrect();
    }

    // Store the selected option ID
    const selectedOptionId = currentQ?.options[optionIndex]?.option_id;
    setQuizAnswers(prev => ({
      ...prev,
      [currentQ.question_id]: selectedOptionId
    }));

    if (isCorrect) {
      setCurrentScore(sc => sc + 1);
    }
  };

  const handleNextQuestion = () => {
    const questions = lesson?.quiz?.questions || [];
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setQuestionRevealed(false);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async (): Promise<void> => {
    if (!lesson || !lesson.quiz) return;
    const questions = lesson.quiz.questions;
    const score = currentScore;
    const totalPoints = questions.length;
    const percentage = Math.round((score / totalPoints) * 100);

    // Build answers with actual selected options
    const answers: QuizAnswer[] = questions.map((q, index) => {
      // Find the selected option for this question
      const selectedOptionId = quizAnswers[index] ?? null;
      const isCorrect = selectedOptionId !== null &&
        q.options[selectedOptionId]?.is_correct === true;

      return {
        question_id: q.question_id,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
      };
    });

    try {
      const response = await api.submitQuizAttempt(id, {
        quiz_id: lesson.quiz.quiz_id,
        answers,
        score,
        total_points: totalPoints,
        percentage,
      });

      if (response.success) {
        setQuizResult({
          score,
          total: totalPoints,
          percentage,
          xpEarned: response.xp_earned || 0,
          totalXp: response.total_xp || 0,
          level: response.level || 1,
          streakDays: response.streak_days || 0,
        });
        setQuizSubmitted(true);
        await fetchAttemptHistory();

        await api.updateLessonProgress(id, {
          current_step: lesson.total_steps,
          lesson_completed: true,
          quiz_completed: true,
          quiz_score: percentage,
        });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  // ─── Loading / Error ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <View style={s.loadingInner}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={s.loadingText}>Getting your adventure ready...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <Text style={s.errorEmoji}>🧭</Text>
        <Text style={s.errorText}>We couldn't find this lesson</Text>
        <Bouncy style={s.errorBackBtn} onPress={() => router.back()}>
          <Text style={s.errorBackBtnText}>← Go Back</Text>
        </Bouncy>
      </SafeAreaView>
    );
  }

  const totalSlides = lesson.total_steps;
  const isQuizSlide = currentSlide >= lesson.contents.length;
  const passed = (quizResult?.percentage || 0) >= 60;
  const isPerfect = (quizResult?.percentage || 0) === 100;
  const currentQuestion = lesson.quiz?.questions[currentQuestionIndex];
  const slideColor = SLIDE_COLORS[currentSlide % SLIDE_COLORS.length];
  const questionColor = SLIDE_COLORS[currentQuestionIndex % SLIDE_COLORS.length];

  // ─── RENDER: Content Slides ──────────────────────────────────────────────
  const renderContentSlides = () => {
    const content = lesson.contents[currentSlide];
    const isLastSlide = currentSlide === lesson.contents.length - 1;

    return (
      <>
        {/* Adventure hero — gradient banner, same brand family as the dashboard */}
        <View style={s.heroWrap}>
          <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
            <DriftingCloud top={8} size={1.2} duration={19000} startX={0} opacity={0.18} trackWidth={SCREEN_WIDTH - 32} />
            <DriftingCloud top={40} size={0.9} duration={15000} startX={SCREEN_WIDTH * 0.4} opacity={0.14} trackWidth={SCREEN_WIDTH - 32} />
            <View style={s.heroTopRow}>
              <View style={s.heroEyebrow}><Text style={s.heroEyebrowText}>🗺️ TODAY'S ADVENTURE</Text></View>
              <View style={s.heroStepPill}><Text style={s.heroStepPillText}>{currentSlide + 1}/{lesson.contents.length}</Text></View>
            </View>
            <Text style={s.heroTitle} numberOfLines={2}>{lesson.title}</Text>
            <Text style={s.heroSub}>{lesson.difficulty || 'Beginner'} level · learn at your own pace</Text>
            <Image source={require('../../assets/images/img/senya_blue.png')} style={s.heroMascot} contentFit="contain" />
          </LinearGradient>
        </View>

        {/* Signature progress element */}
        <AdventurePath
          count={lesson.contents.length}
          current={currentSlide}
          color={slideColor}
          onStonePress={(i) => handleSlideChange(i)}
        />

        {/* Content card with sticker badge */}
        <View style={[s.contentCard, { borderColor: `${slideColor}33` }]}>
          <StickerBadge label={`STEP ${currentSlide + 1}`} color={slideColor} />
          <Text style={[s.contentTitle, { color: slideColor }]}>{content.title}</Text>
          <Text style={s.contentBody}>{content.content_text}</Text>
        </View>

        {/* Speech bubble tip from Senya */}
        <View style={s.speechRow}>
          <Image source={require('../../assets/images/img/senyas_logo.png')} style={s.speechAvatar} contentFit="contain" />
          <View style={s.speechBubble}>
            <View style={s.speechTail} />
            <Text style={s.speechText}>
              {currentSlide === 0 ? "Hi, adventurer! I'm Senya — let's explore this together! 🌟" :
                isLastSlide ? "You made it to the end of the trail! Ready for a fun quiz? 🎉" :
                  "Nice! Tap Next to keep walking the path! 🚶"}
            </Text>
          </View>
        </View>

        {/* Big chunky navigation */}
        <View style={s.navRow}>
          {currentSlide > 0 && (
            <Bouncy style={s.ghostBtn} onPress={() => handleSlideChange(currentSlide - 1)}>
              <ArrowLeftIcon />
              <Text style={s.ghostBtnText}>Back</Text>
            </Bouncy>
          )}
          <Bouncy
            style={[
              s.primaryBtn,
              { backgroundColor: isLastSlide ? '#D97706' : slideColor },
              currentSlide > 0 ? { flex: 2 } : { flex: 1 },
            ]}
            onPress={() => {
              if (isLastSlide) {
                setCurrentSlide(totalSlides);
              } else {
                handleSlideChange(currentSlide + 1);
              }
            }}
          >
            <Text style={s.primaryBtnText}>{isLastSlide ? '🧠 Start the Quiz!' : 'Next Step'}</Text>
            {!isLastSlide && <ArrowRightIcon />}
          </Bouncy>
        </View>
      </>
    );
  };

  // ─── RENDER: Quiz Step-by-Step ──────────────────────────────────────────
  const renderQuiz = () => {
    if (!lesson.quiz || !currentQuestion) return null;

    if (quizSubmitted) {
      return renderResults();
    }

    const isCorrect = selectedOption !== null && selectedOption === currentQuestion.options.findIndex(o => o.is_correct);
    const totalQuestions = lesson.quiz.questions.length;
    const optionLabels = ['🅰️', '🅱️', '🅲️', '🅳️'];

    return (
      <>
        <Bouncy style={s.backToLessonBtn} onPress={() => setCurrentSlide(0)}>
          <BookIcon size={16} color="#1848c8" />
          <Text style={s.backToLessonText}>Back to Lesson</Text>
        </Bouncy>

        {/* Quiz hero — colorful gradient banner per question, keeps brand shape */}
        <View style={s.heroWrap}>
          <LinearGradient colors={[questionColor, shadeColor(questionColor, -25)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.quizHeroCard}>
            <View style={s.heroTopRow}>
              <View style={s.heroEyebrow}><Text style={s.heroEyebrowText}>🎯 QUIZ TIME</Text></View>
              <View style={s.heroStepPill}><Text style={s.heroStepPillText}>Q{currentQuestionIndex + 1}/{totalQuestions}</Text></View>
            </View>
            <Text style={s.quizQuestionText}>{currentQuestion.question_text}</Text>
            {currentQuestion.media_url && (
              <Image source={{ uri: currentQuestion.media_url }} style={s.questionMedia} contentFit="contain" />
            )}
          </LinearGradient>
        </View>

        <AdventurePath count={totalQuestions} current={currentQuestionIndex} color={questionColor} completedColor="#22c55e" />

        {currentQuestion.options.map((opt, i) => {
          const isSel = selectedOption === i;
          const isCorr = i === currentQuestion.options.findIndex(o => o.is_correct);
          const optColor = SLIDE_COLORS[i % SLIDE_COLORS.length];

          let bgColor = '#fff';
          let borderColor = '#EEF2F7';
          let textColor = '#0f3172';
          let circleBg = optColor;
          let circleColor = '#fff';

          if (questionRevealed) {
            if (isCorr) { bgColor = '#ECFDF5'; borderColor = '#6EE7B7'; textColor = '#065F46'; circleBg = '#10B981'; }
            else if (isSel) { bgColor = '#FEF2F2'; borderColor = '#FCA5A5'; textColor = '#991B1B'; circleBg = '#EF4444'; }
            else { bgColor = '#F8FAFC'; textColor = '#9CA3AF'; circleBg = '#E5E7EB'; circleColor = '#9CA3AF'; }
          } else if (isSel) {
            bgColor = `${optColor}14`; borderColor = optColor; textColor = optColor;
          }

          return (
            <Bouncy
              key={`${currentQuestionIndex}-${i}`}
              style={[s.optionCard, { backgroundColor: bgColor, borderColor }]}
              onPress={() => handleOptionSelect(i)}
              disabled={questionRevealed}
            >
              <View style={[s.optionCircle, { backgroundColor: circleBg }]}>
                {questionRevealed && isCorr ? <CheckCircleIcon color="#fff" /> :
                  questionRevealed && isSel && !isCorr ? <XCircleIcon color="#fff" /> :
                    <Text style={[s.optionLetter, { color: circleColor }]}>{String.fromCharCode(65 + i)}</Text>}
              </View>
              <Text style={[s.optionText, { color: textColor }]}>{opt.option_text}</Text>
            </Bouncy>
          );
        })}

        <View style={s.feedbackRow}>
          <Animated.View
            style={{
              transform: [
                { scale: senyaBounceAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] }) },
                { translateY: senyaBounceAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -20, 0] }) },
                { rotateZ: senyaShakeAnim.interpolate({ inputRange: [-1, -0.5, 0, 0.5, 1], outputRange: ['-6deg', '-3deg', '0deg', '3deg', '6deg'] }) },
              ],
            }}
          >
            <Image source={require('../../assets/images/img/senya_teaching.png')} style={s.senyaFeedback} contentFit="contain" />
          </Animated.View>
          <View style={[s.feedbackBubble, questionRevealed && isCorrect ? s.feedbackCorrect : questionRevealed ? s.feedbackWrong : {}]}>
            {questionRevealed && isCorrect && <CheckCircleIcon />}
            {questionRevealed && !isCorrect && questionRevealed && <XCircleIcon />}
            <Text style={[s.feedbackText, questionRevealed && isCorrect ? { color: '#065f46' } : questionRevealed ? { color: '#991b1b' } : {}]}>
              {questionRevealed
                ? (isCorrect
                  ? (currentQuestion.options.find(o => o.is_correct)?.option_text || 'Correct! 🎉')
                  : (currentQuestion.options.find(o => o.is_correct)?.option_text || 'Incorrect! 😅'))
                : 'Take your time and pick your answer!'}
            </Text>
          </View>
        </View>

        {questionRevealed && (
          <Bouncy style={[s.primaryBtn, { backgroundColor: isCorrect ? '#22c55e' : questionColor }]} onPress={handleNextQuestion}>
            <Text style={s.primaryBtnText}>
              {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'See My Results'}
            </Text>
            <ArrowRightIcon />
          </Bouncy>
        )}
      </>
    );
  };

  // ─── RENDER: Results Sub-Views ──────────────────────────────────────────
  const renderScoreView = () => {
    const score = quizResult?.score || 0;
    const total = quizResult?.total || 0;
    const pct = quizResult?.percentage || 0;
    const xpEarned = quizResult?.xpEarned || 0;
    const stars = pct === 100 ? 3 : pct >= 80 ? 2 : pct >= 50 ? 1 : 0;

    const { label, color, emoji } =
      pct === 100 ? { label: 'Perfect Score!', color: '#F59E0B', emoji: '🏆' } :
        pct >= 80 ? { label: 'Excellent!', color: '#10B981', emoji: '🎉' } :
          pct >= 60 ? { label: 'Good Job!', color: '#2563EB', emoji: '👏' } :
            { label: 'Keep Practicing!', color: '#8B5CF6', emoji: '💪' };

    return (
      <Animated.View style={[s.resultsContainer, { opacity: resultsFadeAnim, transform: [{ scale: resultsScaleAnim }] }]}>
        <Bouncy style={s.backToLessonBtn} onPress={() => {
          setQuizSubmitted(false);
          setCurrentQuestionIndex(0);
          setSelectedOption(null);
          setQuestionRevealed(false);
          setCurrentScore(0);
          setQuizResult(null);
          setConfettiFired(false);
          resultsFadeAnim.setValue(0);
          resultsScaleAnim.setValue(0.85);
          setCurrentSlide(0);
        }}>
          <BookIcon size={16} color="#fff" />
          <Text style={[s.backToLessonText, { color: '#fff' }]}>Back to Lesson</Text>
        </Bouncy>

        <View style={s.scoreCard}>
          <Text style={s.scoreEmoji}>{emoji}</Text>
          <Image source={require('../../assets/images/img/senya_teaching.png')} style={s.resultSenya} contentFit="contain" />

          <View style={[s.scoreCircleBadge, { borderColor: color }]}>
            <Text style={[s.scoreCircleText, { color }]}>{pct}%</Text>
            <Text style={s.scoreCircleSub}>Score</Text>
          </View>

          <View style={s.starsRow}>
            {[1, 2, 3].map(i => (
              <StarBurstIcon key={i} size={i <= stars ? 34 : 26} color={i <= stars ? '#FBBF24' : '#E2E8F0'} />
            ))}
          </View>

          <Text style={[s.resultLabel, { color }]}>{label}</Text>
          <Text style={s.scoreSubtitle}>{score} out of {total} correct answers</Text>

          <View style={s.xpEarnedBadge}>
            <Text style={s.xpEarnedText}>⚡ +{xpEarned} XP Earned!</Text>
          </View>

          {userRank && (
            <View style={s.userRankBadge}>
              <Text style={s.userRankText}>🏆 Rank #{userRank} on the Leaderboard</Text>
            </View>
          )}
        </View>

        <View style={s.scrollHintContainer}>
          <View style={s.scrollHintPill}>
            <Text style={s.scrollHintText}>👆 Swipe up to see the Leaderboard</Text>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1848c8" strokeWidth="2.5" strokeLinecap="round">
              <Path d="M12 19V5M5 12l7-7 7 7" />
            </Svg>
          </View>
        </View>
      </Animated.View>
    );
  };

  const handleStudentPress = (student: LeaderboardEntry) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const renderLeaderboardView = () => {
    const rankings = leaderboard;
    const rest = rankings.slice(3);

    const rank1 = rankings.find(r => r.rank === 1) || null;
    const rank2 = rankings.find(r => r.rank === 2) || null;
    const rank3 = rankings.find(r => r.rank === 3) || null;

    let rankPercentileText = "Complete the quiz to see your ranking!";
    let rankNumText = "#—";

    if (userRank && rankings.length > 0) {
      rankNumText = `#${userRank}`;
      const peopleBelow = rankings.length - userRank;
      const percentile = Math.round((peopleBelow / rankings.length) * 100);

      if (userRank === 1) {
        rankPercentileText = `🥇 You're #1! You outscored everyone else!`;
      } else if (userRank === 2) {
        rankPercentileText = `🥈 You're #2! You're in the top tier!`;
      } else if (userRank === 3) {
        rankPercentileText = `🥉 You're #3! Amazing performance!`;
      } else {
        const topPercent = Math.round((userRank / rankings.length) * 100);
        if (topPercent <= 25) {
          rankPercentileText = `📈 You're in the top ${100 - percentile}% — keep pushing!`;
        } else if (topPercent <= 50) {
          rankPercentileText = `👏 You're doing better than ${percentile}% of your classmates!`;
        } else {
          rankPercentileText = `💪 Keep practicing! You're improving!`;
        }
      }
    } else if (rankings.length > 0) {
      rankPercentileText = "You haven't ranked on this leaderboard yet. Try again!";
    }

    return (
      <View style={s.leaderboardContainer}>
        <View style={s.leaderboardHeader}>
          <Text style={s.leaderboardHeaderTitle}>🏆 Leaderboard</Text>
        </View>

        {userRank ? (
          <View style={s.rankBanner}>
            <View style={s.rankBannerLeft}>
              <View style={s.rankBannerNumContainer}>
                <Text style={s.rankBannerNum}>{rankNumText}</Text>
              </View>
              <View style={s.rankBannerDivider} />
              <View style={s.rankBannerContent}>
                <Text style={s.rankBannerMessage}>{rankPercentileText}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[s.rankBanner, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <Text style={[s.rankBannerMessage, { textAlign: 'center', marginBottom: 0 }]}>{rankPercentileText}</Text>
          </View>
        )}

        <View style={s.podiumRow}>
          {/* Rank 2 */}
          <View style={s.podiumCol}>
            {rank2 ? (
              <>
                <View style={s.podiumAvatarContainer}>
                  <Pressable onPress={() => handleStudentPress(rank2)}>
                    <View style={[s.podiumAvatar, { borderColor: '#E5E7EB', backgroundColor: '#9CA3AF' }]}>
                      <Text style={s.podiumAvatarInitials}>{rank2.initials}</Text>
                    </View>
                  </Pressable>
                  <Text style={s.podiumBadge}>🥈</Text>
                </View>
                <Text style={s.podiumName} numberOfLines={1}>{rank2.is_me ? 'You' : rank2.name}</Text>
                <View style={s.podiumScoreBadge}><Text style={s.podiumScoreText}>{rank2.best_score}%</Text></View>
              </>
            ) : (
              <>
                <View style={[s.podiumAvatar, s.podiumAvatarPlaceholder]}><Text style={s.podiumAvatarPlaceholderText}>—</Text></View>
                <Text style={s.podiumNamePlaceholder}>TBD</Text>
                <View style={s.podiumScoreBadgePlaceholder}><Text style={s.podiumScoreTextPlaceholder}>—</Text></View>
              </>
            )}
            <View style={[s.podiumBlock, s.podiumBlockSilver]}><Text style={s.podiumBlockNumber}>2</Text></View>
          </View>

          {/* Rank 1 */}
          <View style={s.podiumCol}>
            {rank1 ? (
              <>
                <View style={s.podiumAvatarContainer}>
                  <View style={s.crownContainer}><Text style={{ fontSize: 22 }}>👑</Text></View>
                  <Pressable onPress={() => handleStudentPress(rank1)}>
                    <View style={[s.podiumAvatar, s.podiumAvatarFirst, { borderColor: '#FBBF24', backgroundColor: '#F59E0B' }]}>
                      <Text style={s.podiumAvatarInitials}>{rank1.initials}</Text>
                    </View>
                  </Pressable>
                  <Text style={s.podiumBadge}>🥇</Text>
                </View>
                <Text style={[s.podiumName, { fontWeight: '800' }]} numberOfLines={1}>{rank1.is_me ? 'You' : rank1.name}</Text>
                <View style={[s.podiumScoreBadge, s.podiumScoreBadgeGold]}>
                  <Text style={[s.podiumScoreText, { color: '#D97706' }]}>{rank1.best_score}%</Text>
                </View>
              </>
            ) : (
              <>
                <View style={[s.podiumAvatar, s.podiumAvatarFirst, s.podiumAvatarPlaceholder]}><Text style={s.podiumAvatarPlaceholderText}>—</Text></View>
                <Text style={s.podiumNamePlaceholder}>TBD</Text>
                <View style={s.podiumScoreBadgePlaceholder}><Text style={s.podiumScoreTextPlaceholder}>—</Text></View>
              </>
            )}
            <View style={[s.podiumBlock, s.podiumBlockGold]}><Text style={s.podiumBlockNumber}>1</Text></View>
          </View>

          {/* Rank 3 */}
          <View style={s.podiumCol}>
            {rank3 ? (
              <>
                <View style={s.podiumAvatarContainer}>
                  <Pressable onPress={() => handleStudentPress(rank3)}>
                    <View style={[s.podiumAvatar, { borderColor: '#F97316', backgroundColor: '#C2410C' }]}>
                      <Text style={s.podiumAvatarInitials}>{rank3.initials}</Text>
                    </View>
                  </Pressable>
                  <Text style={s.podiumBadge}>🥉</Text>
                </View>
                <Text style={s.podiumName} numberOfLines={1}>{rank3.is_me ? 'You' : rank3.name}</Text>
                <View style={s.podiumScoreBadge}><Text style={s.podiumScoreText}>{rank3.best_score}%</Text></View>
              </>
            ) : (
              <>
                <View style={[s.podiumAvatar, s.podiumAvatarPlaceholder]}><Text style={s.podiumAvatarPlaceholderText}>—</Text></View>
                <Text style={s.podiumNamePlaceholder}>TBD</Text>
                <View style={s.podiumScoreBadgePlaceholder}><Text style={s.podiumScoreTextPlaceholder}>—</Text></View>
              </>
            )}
            <View style={[s.podiumBlock, s.podiumBlockBronze]}><Text style={s.podiumBlockNumber}>3</Text></View>
          </View>
        </View>

        <View style={s.leaderboardListCard}>
          <Text style={s.leaderboardListTitle}>All Rankings</Text>

          {loadingLeaderboard ? (
            <View style={s.loadingLeaderboard}>
              <ActivityIndicator size="small" color="#1848c8" />
              <Text style={s.loadingLeaderboardText}>Loading rankings...</Text>
            </View>
          ) : rankings.length === 0 ? (
            <Text style={s.noRankingsText}>No entries yet. Be the first to rank!</Text>
          ) : rest.length === 0 ? (
            <Text style={s.noRankingsText}>Only the top 3 are on the board so far!</Text>
          ) : (
            rest.map((r, index) => {
              const itemRank = r.rank;
              return (
                <Pressable
                  key={r.student_id}
                  style={[
                    s.leaderboardListItem,
                    r.is_me && s.leaderboardListItemMe,
                    index < rest.length - 1 && s.leaderboardListItemBorder,
                  ]}
                  onPress={() => handleStudentPress(r)}
                >
                  <View style={s.listRankCircle}><Text style={s.listRankText}>{itemRank}</Text></View>
                  <View style={[s.listAvatar, r.is_me && { backgroundColor: '#1848c8' }]}>
                    <Text style={s.listAvatarText}>{r.initials}</Text>
                  </View>
                  <View style={s.listNameContainer}>
                    <Text style={[s.listName, r.is_me && s.listNameMe]}>{r.is_me ? 'You' : r.name}</Text>
                    <Text style={s.listAttempts}>{r.attempts} {r.attempts === 1 ? 'try' : 'tries'}</Text>
                  </View>
                  <Text style={[s.listScoreText, r.is_me && s.listScoreTextMe]}>{r.best_score}%</Text>
                </Pressable>
              );
            })
          )}

          <Pressable style={[s.historyToggleBtn, { marginTop: 18 }]} onPress={() => setShowHistory(!showHistory)}>
            <View style={s.historyToggleLeft}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
              <Text style={s.historyToggleText}>Your Attempt History</Text>
              <View style={s.historyCountBadge}><Text style={s.historyCountText}>{attemptHistory.length}</Text></View>
            </View>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1848c8" strokeWidth="2.5">
              {showHistory ? <Path d="M18 15l-6-6-6 6" /> : <Path d="M6 9l6 6 6-6" />}
            </Svg>
          </Pressable>

          {showHistory && (
            <View style={s.historyList}>
              {attemptHistory.length === 0 ? (
                <Text style={s.historyEmpty}>No previous attempts found.</Text>
              ) : (
                attemptHistory.map((attempt, index) => (
                  <View key={index} style={s.historyItem}>
                    <Text style={s.historyItemLabel}>Attempt #{attemptHistory.length - index}</Text>
                    <View style={s.historyItemScore}>
                      <Text style={[s.historyItemScoreText, { color: attempt.percentage >= 60 ? '#10B981' : '#EF4444' }]}>
                        {attempt.percentage}%
                      </Text>
                      <Text style={s.historyItemStatus}>{attempt.percentage >= 60 ? '✅ Passed' : '❌ Failed'}</Text>
                    </View>
                    <Text style={s.historyItemDate}>
                      {new Date(attempt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={s.leaderboardActions}>
            <Bouncy style={[s.smallBtn, s.smallGhostBtn]} onPress={() => {
              resultsFadeAnim.setValue(0);
              resultsScaleAnim.setValue(0.85);
              setQuizSubmitted(false);
              setCurrentQuestionIndex(0);
              setSelectedOption(null);
              setQuestionRevealed(false);
              setCurrentScore(0);
              setQuizResult(null);
              setConfettiFired(false);
              setCurrentSlide(0);
              resultsScrollRef.current?.scrollTo?.({ y: 0, animated: true });
            }}>
              <RefreshIcon size={14} color="#0f3172" />
              <Text style={s.smallBtnText}>Try Again</Text>
            </Bouncy>

            <Bouncy style={[s.smallBtn, s.smallPrimaryBtn]} onPress={() => {
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
                const nextLevel = level + 1;
                return thresholds[nextLevel] || 4000 + ((level - 9) * 1000);
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
              resultsFadeAnim.setValue(0);
              resultsScaleAnim.setValue(0.85);
              setCurrentSlide(0);

              if (xpEarned > 0) {
                router.push({
                  pathname: '/lesson/xp-progress',
                  params: {
                    xpEarned: String(xpEarned),
                    totalXp: String(totalXp),
                    level: String(currentLevel),
                    levelName: levelName,
                    previousXp: String(previousXp),
                    nextLevelXp: String(nextLevelXp),
                    showStreak: 'true',
                    streakDays: String(streakDays),
                  },
                });
              } else {
                router.push({
                  pathname: '/lesson/streak',
                  params: {
                    streakDays: String(streakDays),
                    xpEarned: String(xpEarned),
                    totalXp: String(totalXp),
                    level: String(currentLevel),
                    levelName: levelName,
                  },
                });
              }
            }}>
              <HomeIcon size={14} color="#fff" />
              <Text style={[s.smallBtnText, { color: '#fff' }]}>Continue</Text>
            </Bouncy>
          </View>
        </View>
      </View>
    );
  };

  const renderResults = () => {
    const SCREEN_HEIGHT = Dimensions.get('window').height;
    const scoreTranslateY = parallelScrollY.interpolate({
      inputRange: [0, SCREEN_HEIGHT], outputRange: [0, -SCREEN_HEIGHT * 0.15], extrapolate: 'clamp',
    });
    const scoreOpacity = parallelScrollY.interpolate({
      inputRange: [0, SCREEN_HEIGHT * 0.25, SCREEN_HEIGHT * 0.5], outputRange: [1, 0.75, 0], extrapolate: 'clamp',
    });
    const scoreScale = parallelScrollY.interpolate({
      inputRange: [0, SCREEN_HEIGHT * 0.5], outputRange: [1, 0.95], extrapolate: 'clamp',
    });
    const bgColor = parallelScrollY.interpolate({
      inputRange: [0, SCREEN_HEIGHT * 0.4], outputRange: ['#1a6fd4', '#0d326b'], extrapolate: 'clamp',
    });

    return (
      <Animated.View style={{ flex: 1, backgroundColor: bgColor }}>
        <Animated.ScrollView
          ref={resultsScrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 0 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: parallelScrollY } } }], { useNativeDriver: false })}
        >
          <View style={[s.topBar, { paddingHorizontal: 16, paddingTop: 8 }]}>
            <Text style={[s.logoText, { color: '#fff' }]}>SEÑAS</Text>
          </View>

          <Animated.View style={{ paddingHorizontal: 16, paddingBottom: 8, opacity: scoreOpacity, transform: [{ translateY: scoreTranslateY }, { scale: scoreScale }] }}>
            {renderScoreView()}
          </Animated.View>

          <View style={s.leaderboardSheet}>
            <View style={s.sheetHandle} />
            {renderLeaderboardView()}
          </View>
        </Animated.ScrollView>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: '#F0F6FF' }]}>
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

      <ExitModal visible={showExitModal} onClose={() => setShowExitModal(false)} onConfirm={handleExit} />
      <StudentDetailModal visible={showStudentDetail} onClose={() => setShowStudentDetail(false)} student={selectedStudent} />

      {quizSubmitted ? (
        renderResults()
      ) : (
        <ScrollView contentContainerStyle={s.moduleScroll}>
          <View style={s.topBar}>
            <Text style={s.logoText}>SEÑAS</Text>
            <Bouncy style={s.exitBtn} onPress={() => setShowExitModal(true)}>
              <CloseIcon size={14} color="#6B7280" />
            </Bouncy>
          </View>
          {!isQuizSlide ? renderContentSlides() : renderQuiz()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Small color helper (kept UI-only, no backend impact) ──────────────────
function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // ── Confetti Wrapper ──
  confettiWrapper: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999, pointerEvents: 'none', elevation: 9999,
  },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F6FF' },
  loadingInner: { alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, fontWeight: '700', color: '#4B7FCC' },
  errorEmoji: { fontSize: 46, marginBottom: 6 },
  errorText: { fontSize: 17, color: '#0f3172', marginBottom: 16, fontWeight: '800' },
  errorBackBtn: { backgroundColor: '#2563EB', borderRadius: 40, paddingVertical: 12, paddingHorizontal: 26 },
  errorBackBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(13,50,107,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },

  // Exit modal
  exitModal: { width: '88%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 32, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.18, shadowRadius: 48, elevation: 24 },
  exitEmoji: { fontSize: 44, marginBottom: 10 },
  exitTitle: { fontSize: 20, fontWeight: '900', color: '#0f3172', marginBottom: 8, textAlign: 'center' },
  exitDesc: { fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 20, marginBottom: 24, textAlign: 'center' },
  exitBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  stayBtn: { flex: 1.3, paddingVertical: 14, backgroundColor: '#1848c8', borderRadius: 40, alignItems: 'center' },
  stayText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  exitConfirmBtn: { flex: 1, paddingVertical: 14, backgroundColor: 'rgba(220,38,38,0.10)', borderRadius: 40, alignItems: 'center' },
  exitConfirmText: { fontSize: 14, fontWeight: '800', color: '#DC2626' },

  // Layout
  moduleScroll: { padding: 16, paddingBottom: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  logoText: { color: '#0f3172', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  exitBtn: { backgroundColor: '#fff', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF2F7' },

  // Back to Lesson button
  backToLessonBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 4, marginBottom: 4, alignSelf: 'flex-start' },
  backToLessonText: { fontSize: 14, fontWeight: '700', color: '#1848c8' },

  // ── Hero adventure banner ──
  heroWrap: { borderRadius: 28, overflow: 'hidden', marginBottom: 18, shadowColor: '#0d326b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 8 },
  heroCard: { padding: 20, minHeight: 160, overflow: 'hidden' },
  quizHeroCard: { padding: 20, minHeight: 140, overflow: 'hidden' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heroEyebrow: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 99, paddingVertical: 5, paddingHorizontal: 12 },
  heroEyebrowText: { fontSize: 10.5, fontWeight: '800', color: '#fde68a', letterSpacing: 0.5 },
  heroStepPill: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 99, paddingVertical: 5, paddingHorizontal: 12 },
  heroStepPillText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4, maxWidth: '75%' },
  heroSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.8)', fontWeight: '600', maxWidth: '70%' },
  heroMascot: { position: 'absolute', right: -6, bottom: -10, width: 96, height: 96 },
  quizQuestionText: { fontSize: 17, fontWeight: '800', color: '#fff', lineHeight: 24 },
  questionMedia: { width: '100%', height: 140, borderRadius: 14, marginTop: 12 },

  // ── Adventure Path (signature progress) ──
  pathWrap: { marginBottom: 16, paddingHorizontal: 4, position: 'relative', height: 56, justifyContent: 'center' },
  pathTrack: { position: 'absolute', left: 20, right: 20, top: '50%', height: 4, borderRadius: 4, backgroundColor: '#DCE7FB' },
  pathRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pathStoneTouchable: { alignItems: 'center', justifyContent: 'center' },
  pathStone: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  pathStoneText: { fontSize: 12, fontWeight: '900' },

  // ── Content card + sticker ──
  contentCard: { backgroundColor: '#fff', borderWidth: 2, borderRadius: 24, padding: 20, marginBottom: 14, minHeight: 160, shadowColor: '#0f3172', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  stickerBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12, marginBottom: 12, marginLeft: -4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  stickerBadgeText: { fontSize: 10.5, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  contentTitle: { fontSize: 19, fontWeight: '900', marginBottom: 10 },
  contentBody: { fontSize: 15, color: '#334155', lineHeight: 24, fontWeight: '500' },

  // ── Speech bubble ──
  speechRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 18 },
  speechAvatar: { width: 52, height: 52, flexShrink: 0 },
  speechBubble: { flex: 1, backgroundColor: '#FFF7E6', borderWidth: 1.5, borderColor: '#FDE9B8', borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, position: 'relative' },
  speechTail: { position: 'absolute', left: -8, bottom: 10, width: 0, height: 0, borderTopWidth: 8, borderTopColor: 'transparent', borderBottomWidth: 8, borderBottomColor: 'transparent', borderRightWidth: 10, borderRightColor: '#FFF7E6' },
  speechText: { fontSize: 13, color: '#92400E', fontWeight: '700', lineHeight: 19 },

  // ── Navigation ──
  navRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: '#1848c8', borderRadius: 60, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#1848c8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  ghostBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 60, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { fontSize: 16, fontWeight: '800', color: '#0f3172' },

  // ── Quiz options ──
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderRadius: 20, padding: 15, marginBottom: 10 },
  optionCircle: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionLetter: { fontSize: 15, fontWeight: '900' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 21 },

  feedbackRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginVertical: 14 },
  senyaFeedback: { width: 76, height: 76, flexShrink: 0 },
  feedbackBubble: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#EEF2F7', borderRadius: 18, padding: 13 },
  feedbackCorrect: { backgroundColor: '#ECFDF5', borderColor: '#a7f3d0' },
  feedbackWrong: { backgroundColor: '#FEF2F2', borderColor: '#fecaca' },
  feedbackText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0f3172', lineHeight: 19 },

  // ── Results ──
  resultsContainer: { gap: 8 },
  scoreCard: { backgroundColor: '#fff', borderRadius: 28, alignItems: 'center', paddingVertical: 26, paddingHorizontal: 20, shadowColor: '#0d326b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 6 },
  scoreEmoji: { fontSize: 34, marginBottom: 2 },
  resultSenya: { width: 84, height: 84, marginBottom: 2 },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 8 },
  resultLabel: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  scoreSubtitle: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 10 },
  xpEarnedBadge: { backgroundColor: '#FEF3C7', borderRadius: 99, paddingVertical: 7, paddingHorizontal: 18 },
  xpEarnedText: { fontSize: 14, fontWeight: '900', color: '#92400E' },
  userRankBadge: { marginTop: 8, backgroundColor: '#FEF3C7', borderRadius: 99, paddingVertical: 5, paddingHorizontal: 16 },
  userRankText: { fontSize: 13, fontWeight: '800', color: '#D97706' },

  loadingLeaderboard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  loadingLeaderboardText: { fontSize: 14, color: '#6B7280' },
  noRankingsText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 20 },

  // History
  historyToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EFF6FF', borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#BFDBFE' },
  historyToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyToggleText: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  historyCountBadge: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  historyCountText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  historyList: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginTop: 4, borderWidth: 1, borderColor: '#EEF2F7' },
  historyEmpty: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
  historyItemLabel: { fontSize: 13, fontWeight: '600', color: '#0f3172' },
  historyItemScore: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyItemScoreText: { fontSize: 14, fontWeight: '800' },
  historyItemStatus: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  historyItemDate: { fontSize: 10, color: '#9CA3AF' },

  scoreCircleBadge: { width: 108, height: 108, borderRadius: 54, backgroundColor: '#F0F6FF', borderWidth: 6, alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  scoreCircleText: { fontSize: 28, fontWeight: '900' },
  scoreCircleSub: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },

  leaderboardContainer: { flex: 1 },
  leaderboardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  leaderboardHeaderTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 0.5 },
  rankBanner: { marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  rankBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rankBannerNumContainer: { minWidth: 48, alignItems: 'center' },
  rankBannerNum: { fontSize: 28, fontWeight: '900', color: '#FBBF24', textShadowColor: 'rgba(251,191,36,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  rankBannerDivider: { width: 1.5, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  rankBannerContent: { flex: 1 },
  rankBannerMessage: { fontSize: 13, fontWeight: '600', color: '#fff', lineHeight: 18, flexShrink: 1 },

  podiumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginHorizontal: 16, paddingBottom: 16, height: 240 },
  podiumCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  podiumAvatarContainer: { position: 'relative', alignItems: 'center', marginBottom: 6 },
  crownContainer: { position: 'absolute', top: -16, zIndex: 10 },
  podiumAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  podiumAvatarFirst: { width: 60, height: 60, borderRadius: 30, borderWidth: 3 },
  podiumAvatarInitials: { fontSize: 14, fontWeight: '800', color: '#fff' },
  podiumAvatarPlaceholder: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255, 255, 255, 0.4)', backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', justifyContent: 'center' },
  podiumAvatarPlaceholderText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.4)', fontWeight: 'bold' },
  podiumBadge: { position: 'absolute', bottom: -6, right: -4, fontSize: 14 },
  podiumName: { fontSize: 12, fontWeight: '700', color: '#fff', marginTop: 4, textAlign: 'center', width: 80 },
  podiumNamePlaceholder: { fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.4)', marginTop: 4, textAlign: 'center' },
  podiumScoreBadge: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  podiumScoreBadgeGold: { backgroundColor: '#FFFBEB' },
  podiumScoreBadgePlaceholder: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  podiumScoreText: { fontSize: 10, fontWeight: '800', color: '#1848c8' },
  podiumScoreTextPlaceholder: { fontSize: 10, fontWeight: '600', color: 'rgba(255, 255, 255, 0.3)' },
  podiumBlock: { width: '90%', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  podiumBlockGold: { height: 110, backgroundColor: 'rgba(255, 255, 255, 0.28)' },
  podiumBlockSilver: { height: 85, backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  podiumBlockBronze: { height: 65, backgroundColor: 'rgba(255, 255, 255, 0.11)' },
  podiumBlockNumber: { fontSize: 24, fontWeight: '900', color: '#fff' },

  leaderboardListCard: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 30, minHeight: 200 },
  leaderboardListTitle: { fontSize: 16, fontWeight: '900', color: '#0f3172', marginBottom: 16 },
  leaderboardListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  leaderboardListItemMe: { backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 12, marginHorizontal: -12 },
  leaderboardListItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  listRankCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  listRankText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  listAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  listNameContainer: { flex: 1 },
  listName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  listNameMe: { fontWeight: '800', color: '#1848c8' },
  listAttempts: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  listScoreText: { fontSize: 15, fontWeight: '800', color: '#3B82F6' },
  listScoreTextMe: { color: '#1848c8' },

  scrollHintContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 12, paddingBottom: 16, marginBottom: 0 },
  scrollHintPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', shadowColor: '#0f3172', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  scrollHintText: { fontSize: 13, fontWeight: '700', color: '#1848c8', letterSpacing: 0.3 },
  leaderboardSheet: { backgroundColor: '#1848c8', borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -8, paddingBottom: 0, shadowColor: '#000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.22, shadowRadius: 24, elevation: 20, overflow: 'hidden' },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)', marginTop: 10, marginBottom: 4 },

  leaderboardActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  smallBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12 },
  smallPrimaryBtn: { backgroundColor: '#1848c8', shadowColor: '#1848c8', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  smallGhostBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'rgba(15,30,80,0.08)' },
  smallBtnText: { fontSize: 13, fontWeight: '800', color: '#0f3172' },

  // ── Student Detail Modal ──
  studentDetailModal: { width: '85%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 32, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 48, elevation: 24 },
  studentDetailClose: { position: 'absolute', top: 16, right: 16, padding: 4 },
  studentDetailAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 12, borderWidth: 3, borderColor: '#E5E7EB' },
  studentDetailAvatarMe: { backgroundColor: '#1848c8', borderColor: '#1848c8' },
  studentDetailAvatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  studentDetailName: { fontSize: 20, fontWeight: '900', color: '#0f3172', marginBottom: 2 },
  studentDetailUsername: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginBottom: 16 },
  studentDetailDivider: { width: '100%', height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 },
  studentDetailStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 16 },
  studentDetailStat: { flex: 1, alignItems: 'center' },
  studentDetailStatLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  studentDetailStatValue: { fontSize: 20, fontWeight: '900', color: '#0f3172' },
  studentDetailStatDivider: { width: 1, height: 32, backgroundColor: '#F3F4F6' },
  studentDetailNote: { backgroundColor: '#F3F4F6', borderRadius: 14, padding: 12, width: '100%', marginBottom: 16 },
  studentDetailNoteText: { fontSize: 13, fontWeight: '500', color: '#4B5563', textAlign: 'center', lineHeight: 18 },
  studentDetailBtn: { backgroundColor: '#1848c8', borderRadius: 40, paddingVertical: 12, paddingHorizontal: 48, shadowColor: '#1848c8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  studentDetailBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});