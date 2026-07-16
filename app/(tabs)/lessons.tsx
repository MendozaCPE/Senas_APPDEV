// app/(tabs)/lessons.tsx
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  View
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import {
  AlphabetIcon,
  BookIcon,
  CheckIcon,
  FlameIcon,
  GreetingIcon,
  LockIcon,
  NumbersIcon
} from '../../components/ui/icons';
import { api } from '../../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MascotImage = require('../../assets/images/img/senyas_logo.png');

// ── Design Geometry Constants ──────────────────────────────────────────
const NODE_ROW_HEIGHT = 150;
const NODE_RADIUS = 38;
const HORIZ_PADDING = 50;
const MAP_WIDTH = screenWidth - HORIZ_PADDING * 2;
const TOP_PADDING = 130;
const BOTTOM_PADDING = 140;

const ACCENT_COLORS = [
  '#FF6B6B', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#E11D48',
];

const getNodePosition = (index: number, total: number) => {
  const cycle = [0.5, 0.76, 0.5, 0.24];
  const xPct = cycle[index % cycle.length];
  const x = HORIZ_PADDING + MAP_WIDTH * xPct;
  const contentHeight = total * NODE_ROW_HEIGHT + TOP_PADDING + BOTTOM_PADDING;
  const y = contentHeight - BOTTOM_PADDING - (index * NODE_ROW_HEIGHT + NODE_ROW_HEIGHT / 2);
  return { x, y };
};

const getContentHeight = (total: number) => total * NODE_ROW_HEIGHT + TOP_PADDING + BOTTOM_PADDING;

function PlayIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

function StarIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2.5l2.86 6.24 6.86.66-5.2 4.6 1.56 6.75L12 17.02l-6.08 3.73 1.56-6.75-5.2-4.6 6.86-.66L12 2.5z" />
    </Svg>
  );
}

// Trophy icon for module quiz checkpoints
function TrophyIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
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

function ProgressRing({ size, strokeWidth, pct, trackColor = 'rgba(255,255,255,0.3)', fillColor = '#FFC800' }: {
  size: number; strokeWidth: number; pct: number; trackColor?: string; fillColor?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const dash = (clamped / 100) * circumference;

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
      {clamped > 0 && (
        <Circle
          cx={cx} cy={cy} r={r} stroke={fillColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
    </Svg>
  );
}

function CloudPuffs({ cw, ch, variant }: { cw: number; ch: number; variant: number }) {
  const w = '#ffffff';
  switch (variant % 6) {
    case 0:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.08, width: cw * 0.50, height: ch * 0.72, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.35, width: cw * 0.60, height: ch * 0.88, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw, height: ch * 0.52, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 1:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.20, width: cw * 0.60, height: ch * 1.00, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw * 0.50, height: ch * 0.60, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.52, width: cw * 0.48, height: ch * 0.55, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw, height: ch * 0.40, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    case 2:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.04, width: cw * 0.40, height: ch * 0.95, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.48, width: cw * 0.46, height: ch * 0.80, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw, height: ch * 0.45, borderRadius: 999, backgroundColor: w }} />
        </>
      );
    default:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.00, width: cw * 0.38, height: ch * 0.65, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.25, width: cw * 0.42, height: ch * 0.90, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: cw * 0.55, width: cw * 0.38, height: ch * 0.70, borderRadius: 999, backgroundColor: w }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw, height: ch * 0.42, borderRadius: 999, backgroundColor: w }} />
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

function SparkleField({ contentHeight }: { contentHeight: number }) {
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.85] });

  const dots = Array.from({ length: Math.max(6, Math.floor(contentHeight / 160)) }).map((_, i) => {
    const seed = (i * 137.5) % 1;
    const seed2 = (i * 63.7) % 1;
    return {
      left: 20 + seed * (screenWidth - 40),
      top: 40 + seed2 * (contentHeight - 80),
      size: 3 + (i % 3),
    };
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', left: d.left, top: d.top, width: d.size, height: d.size,
            borderRadius: d.size / 2, backgroundColor: '#ffffff', opacity,
          }}
        />
      ))}
    </View>
  );
}

const generateSPath = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const cpy = (p1.y + p2.y) / 2;
    d += ` C ${p1.x} ${cpy}, ${p2.x} ${cpy}, ${p2.x} ${p2.y}`;
  }
  return d;
};

const getCategoryIcon = (category: string, color: string, size: number = 24) => {
  const cleanCat = category.toLowerCase();
  if (cleanCat.includes('greet')) return <GreetingIcon size={size} color={color} />;
  if (cleanCat.includes('alpha') || cleanCat.includes('letter')) return <AlphabetIcon size={size} color={color} />;
  if (cleanCat.includes('number') || cleanCat.includes('count')) return <NumbersIcon size={size} color={color} />;
  return <BookIcon size={size} color={color} />;
};

// ── MOCK DATA (tab 0 demo — unchanged) ───────────────────────────────
const defaultLessonsData = [
  { id: 1, category: "Greetings", title: "Hello & Goodbye", desc: "Essential everyday greetings in FSL", color: "#FF6B6B", iconBg: "#FFEBEB", duration: "4 min", xp: 15, done: true, active: false, locked: false, progressPercent: 100 },
  { id: 2, category: "Alphabet", title: "Letters A–E", desc: "Learn the first 5 letters of the FSL alphabet", color: "#8B5CF6", iconBg: "#F5F3FF", duration: "5 min", xp: 20, done: true, active: false, locked: false, progressPercent: 100 },
  { id: 3, category: "Greetings", title: "Thank You & Please", desc: "Polite expressions used in everyday conversations", color: "#10B981", iconBg: "#ECFDF5", duration: "4 min", xp: 15, done: false, active: true, locked: false, progressPercent: 40 },
  { id: 4, category: "Numbers", title: "Numbers 1–5", desc: "Count from one to five in FSL", color: "#F59E0B", iconBg: "#FEF3C7", duration: "6 min", xp: 25, done: false, active: false, locked: true, progressPercent: 0 },
  { id: 5, category: "Alphabet", title: "Letters F–J", desc: "Continue with the next 5 alphabet signs", color: "#EC4899", iconBg: "#FDF2F8", duration: "5 min", xp: 20, done: false, active: false, locked: true, progressPercent: 0 },
];

interface Lesson {
  id: number;
  lesson_id?: number;
  title: string;
  description?: string;
  difficulty?: string;
  status?: string;
  total_steps?: number;
  has_quiz?: boolean;
  module_id?: number;
  category: string;
  desc: string;
  color: string;
  iconBg: string;
  duration: string;
  xp: number;
  done: boolean;
  active: boolean;
  locked: boolean;
  progressPercent?: number;
}

interface Module {
  module_id: number;
  title: string;
  description: string;
  lessons: Lesson[];
  quiz_passed?: boolean;   // student passed this module's checkpoint quiz
  quiz_score?: number | null;
  hasQuiz?: boolean;       // default true — set false to skip the checkpoint (used by tab-0 demo)
}

// ── Continuous path model ────────────────────────────────────────────
type PathItem =
  | { type: 'lesson'; key: string; moduleIndex: number; moduleTitle: string; isFirstOfModule: boolean; lesson: Lesson }
  | { type: 'quiz'; key: string; moduleIndex: number; moduleTitle: string; isFirstOfModule: false; module: Module; locked: boolean; done: boolean };

/**
 * Flattens modules into one sequential path.
 * A module's lessons stay locked until the previous module's quiz is passed.
 * A module's quiz checkpoint stays locked until every lesson in that module is done.
 */
const buildPathItems = (mods: Module[]): PathItem[] => {
  const items: PathItem[] = [];
  let moduleUnlocked = true;

  mods.forEach((mod, mIdx) => {
    mod.lessons.forEach((lesson, lIdx) => {
      const effectiveLocked = moduleUnlocked ? lesson.locked : true;
      items.push({
        type: 'lesson',
        key: `l-${lesson.id}`,
        moduleIndex: mIdx,
        moduleTitle: mod.title,
        isFirstOfModule: lIdx === 0,
        lesson: { ...lesson, locked: effectiveLocked },
      });
    });

    const hasQuiz = mod.hasQuiz !== false;
    if (hasQuiz) {
      const allLessonsDone = mod.lessons.length > 0 && mod.lessons.every(l => l.done);
      const quizDone = !!mod.quiz_passed;
      const quizLocked = !moduleUnlocked || !allLessonsDone;
      items.push({
        type: 'quiz',
        key: `q-${mod.module_id}`,
        moduleIndex: mIdx,
        moduleTitle: mod.title,
        isFirstOfModule: false,
        module: mod,
        locked: quizLocked,
        done: quizDone,
      });
      moduleUnlocked = quizDone;
    } else {
      moduleUnlocked = mod.lessons.length > 0 && mod.lessons.every(l => l.done);
    }
  });

  return items;
};

export default function Lessons() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [streak, setStreak] = useState<number>(12);
  const [xp, setXp] = useState<number>(150);

  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  const scrollRef = useRef<ScrollView>(null);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const tabFadeAnim = useRef(new Animated.Value(1)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true })])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    bob.start();
    return () => bob.stop();
  }, [bobAnim]);

  const loadModulesData = async () => {
    try {
      setLoadingModules(true);
      const response = await api.getStudentLessons();

      if (response.success && response.modules) {
        const transformedModules: Module[] = response.modules.map((module: any) => {
          const lessons = module.lessons || [];

          const transformedLessons: Lesson[] = lessons.map((lesson: any, index: number) => {
            const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
            const isFirstLesson = index === 0;

            let isNextLesson = false;
            if (index > 0) {
              const prevLesson = lessons[index - 1];
              if (prevLesson && prevLesson.status === 'completed' && (prevLesson.score || 0) >= 60) {
                isNextLesson = true;
              }
            }

            let isLocked = false;
            if (isFirstLesson) {
              isLocked = false;
            } else if (lesson.status === 'completed' && (lesson.score || 0) >= 60) {
              isLocked = false;
            } else if (isNextLesson) {
              isLocked = false;
            } else {
              isLocked = (lesson.is_locked === true || lesson.status === 'failed');
            }

            const isDone = lesson.status === 'completed' && (lesson.score || 0) >= 60;
            const isActive = lesson.status === 'in_progress' || (isNextLesson && (lesson.status === 'pending' || lesson.status === 'failed'));

            let progressPercent = 0;
            if (isDone) {
              progressPercent = 100;
            } else if (lesson.current_step && lesson.total_steps) {
              progressPercent = Math.round((lesson.current_step / lesson.total_steps) * 100);
            } else if (lesson.status === 'in_progress') {
              progressPercent = 45;
            } else if (lesson.status === 'failed') {
              progressPercent = 25;
            }

            return {
              id: lesson.lesson_id || lesson.id,
              lesson_id: lesson.lesson_id || lesson.id,
              title: lesson.title,
              description: lesson.description,
              difficulty: lesson.difficulty,
              status: lesson.status,
              total_steps: lesson.total_steps,
              has_quiz: lesson.has_quiz,
              module_id: lesson.module_id,
              category: lesson.difficulty ? lesson.difficulty.charAt(0).toUpperCase() + lesson.difficulty.slice(1) : "Lesson",
              desc: lesson.description || "Complete the contents and quiz assigned by your teacher.",
              color,
              iconBg: color + '18',
              duration: lesson.total_steps ? `${lesson.total_steps * 2} min` : "5 min",
              xp: lesson.has_quiz ? 30 : 20,
              done: isDone,
              active: isActive,
              locked: isLocked,
              progressPercent,
            };
          });

          return {
            module_id: module.module_id,
            title: module.title,
            description: module.description || '',
            lessons: transformedLessons,
            quiz_passed: module.quiz_passed || false,
            quiz_score: module.quiz_score ?? null,
            hasQuiz: true,
          };
        });

        setModules(transformedModules);

        if (response.student) {
          setStreak(response.student.streak_days || 0);
          setXp(response.student.total_xp || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching modules and lessons:', error);
    } finally {
      setLoadingModules(false);
    }
  };

  useEffect(() => {
    loadModulesData();
  }, []);

  const activeModules: Module[] = useMemo(() => {
    if (activeTab === 0) {
      return [{
        module_id: 0,
        title: "Unit 1: Basics",
        description: "Master the alphabet and essential greetings",
        lessons: defaultLessonsData,
        hasQuiz: false,
      }];
    }
    return modules;
  }, [activeTab, modules]);

  const pathItems: PathItem[] = useMemo(() => buildPathItems(activeModules), [activeModules]);
  const totalNodes = pathItems.length;

  const points = pathItems.map((_, i) => getNodePosition(i, totalNodes));
  const contentHeight = getContentHeight(totalNodes);

  const getActivePathIndex = () => {
    let idx = 0;
    pathItems.forEach((item, i) => {
      if (item.type === 'lesson' && (item.lesson.done || item.lesson.active)) idx = i;
      if (item.type === 'quiz' && item.done) idx = i;
    });
    return idx;
  };

  const activePathIndex = getActivePathIndex();
  const backgroundPathD = generateSPath(points);
  const progressPathD = generateSPath(points.slice(0, activePathIndex + 1));

  const scrollToActive = () => {
    if (!points[activePathIndex]) return;
    const targetY = Math.max(0, points[activePathIndex].y - screenHeight * 0.5);
    scrollRef.current?.scrollTo({ y: targetY, animated: false });
  };

  useEffect(() => {
    const t = setTimeout(scrollToActive, 60);
    return () => clearTimeout(t);
  }, [activeTab, modules.length, loadingModules]);

  const switchTab = (targetTab: number) => {
    if (targetTab === activeTab || isNavigating) return;
    setIsNavigating(true);
    setSelectedKey(null);
    setActiveTab(targetTab);

    Animated.sequence([
      Animated.timing(tabFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(tabFadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => setIsNavigating(false));
  };

  const completedNodesCount = pathItems.filter(
    i => (i.type === 'lesson' && i.lesson.done) || (i.type === 'quiz' && i.done)
  ).length;
  const pct = totalNodes === 0 ? 0 : Math.round((completedNodesCount / totalNodes) * 100);

  const selectedItem = pathItems.find(i => i.key === selectedKey) || null;

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] });
  const bobY = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  const activePos = points[activePathIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.cloudLayer} pointerEvents="none">
        <DriftingCloud top={30} size={2.0} duration={26000} startX={0} opacity={0.22} variant={0} trackWidth={screenWidth} />
        <DriftingCloud top={90} size={1.4} duration={20000} startX={screenWidth * 0.5} opacity={0.16} variant={2} trackWidth={screenWidth} />
        <DriftingCloud top={150} size={1.7} duration={23000} startX={screenWidth * 0.2} opacity={0.14} variant={4} trackWidth={screenWidth} />
      </View>

      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.logoText}>SEÑAS</Text>
          <View style={styles.topBarRight}>
            <View style={styles.xpTopBadge}>
              <Text style={styles.xpTopText}>⚡ {xp} XP</Text>
            </View>
            <View style={styles.streakBadge}>
              <FlameIcon size={16} color="#fbbf24" />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          </View>
        </View>

        <View style={styles.unitBanner}>
          <View style={styles.bannerRow}>
            <Pressable
              style={[styles.arrowButton, (activeTab === 0 || isNavigating) && styles.arrowButtonDisabled]}
              onPress={() => switchTab(0)}
              disabled={activeTab === 0 || isNavigating}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab === 0 ? "#94A3B8" : "#fff"} strokeWidth="3">
                <Path d="M15 18l-6-6 6-6" />
              </Svg>
            </Pressable>

            <View style={styles.bannerTitleContainer}>
              <Text style={styles.unitTitle}>
                {activeTab === 0 ? "Unit 1: Basics" : "Your Learning Path"}
              </Text>
              <Text style={styles.unitDesc}>
                {activeTab === 0
                  ? "Master the alphabet and essential greetings"
                  : "Lessons that your Teacher assign to you"}
              </Text>
            </View>

            <Pressable
              style={[styles.arrowButton, (activeTab === 1 || isNavigating) && styles.arrowButtonDisabled]}
              onPress={() => switchTab(1)}
              disabled={activeTab === 1 || isNavigating}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab === 1 ? "#94A3B8" : "#fff"} strokeWidth="3">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </Pressable>
          </View>

          {totalNodes > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressText}>{completedNodesCount} of {totalNodes} steps done</Text>
                <Text style={styles.progressText}>{pct}% Completed</Text>
              </View>
            </View>
          )}
        </View>

        <Animated.View style={[styles.mapContainer, { opacity: tabFadeAnim }]}>
          {activeTab === 1 && loadingModules ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loaderText}>Loading modules...</Text>
            </View>
          ) : totalNodes === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIllustrationBox}>
                <BookIcon size={64} color="#fff" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 0 ? "No Lessons Yet!" : "No Lessons Available"}
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === 0
                  ? "Your teacher hasn't uploaded any lessons yet. Check back later!"
                  : "Your teacher hasn't assigned any modules yet."}
              </Text>
              {activeTab === 1 && (
                <Pressable style={styles.emptyRefreshBtn} onPress={loadModulesData}>
                  <Text style={styles.emptyRefreshBtnText}>Refresh</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ height: contentHeight }}
              showsVerticalScrollIndicator={false}
            >
              <SparkleField contentHeight={contentHeight} />

              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Svg width={screenWidth} height={contentHeight}>
                  {backgroundPathD !== '' && (
                    <Path d={backgroundPathD} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="6" strokeLinecap="round" strokeDasharray="8 12" />
                  )}
                  {progressPathD !== '' && (
                    <>
                      <Path d={progressPathD} fill="none" stroke="#FCD34D" strokeWidth="12" strokeLinecap="round" opacity={0.25} />
                      <Path d={progressPathD} fill="none" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
                    </>
                  )}
                </Svg>
              </View>

              <View style={[styles.startMarker, { top: contentHeight - BOTTOM_PADDING * 0.42 }]} pointerEvents="none">
                <View style={styles.startFlag}>
                  <Text style={styles.startFlagText}>🏁 START</Text>
                </View>
              </View>

              <View style={[styles.finishMarker, { top: TOP_PADDING * 0.28 }]} pointerEvents="none">
                <View style={styles.finishBadge}>
                  <Text style={styles.finishBadgeText}>🏆</Text>
                </View>
                <Text style={styles.finishLabel}>GOAL</Text>
              </View>

              {activePos && (
                <Animated.View
                  style={[
                    styles.mascotContainer,
                    {
                      left: (() => {
                        const cycle = [0.5, 0.76, 0.5, 0.24];
                        const xPct = cycle[activePathIndex % cycle.length];
                        return xPct > 0.5 ? activePos.x - 95 : activePos.x + 50;
                      })(),
                      top: activePos.y - 75,
                      transform: [{ translateY: bobY }],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Image source={MascotImage} style={styles.mascotImage} contentFit="contain" />
                  <View style={styles.mascotBubble}>
                    <Text style={styles.mascotBubbleText}>🌟 You got this!</Text>
                  </View>
                </Animated.View>
              )}

              {pathItems.map((item, index) => {
                const pos = points[index];

                // ── Module divider banner, drawn before the first lesson of every module after the first ──
                const banner = item.type === 'lesson' && item.isFirstOfModule && item.moduleIndex > 0 && (
                  <View
                    key={`banner-${item.moduleIndex}`}
                    style={[styles.moduleBanner, { top: pos.y + NODE_ROW_HEIGHT * 0.62 }]}
                    pointerEvents="none"
                  >
                    <Text style={styles.moduleBannerText}>{item.moduleTitle.toUpperCase()}</Text>
                  </View>
                );

                if (item.type === 'lesson') {
                  const lesson = item.lesson;
                  const isSelected = selectedKey === item.key;
                  const isCurrent = lesson.active && !lesson.locked;
                  const nodePct = lesson.progressPercent ?? (lesson.done ? 100 : 0);

                  let nodeBg = lesson.color;
                  let iconColor = '#fff';
                  if (lesson.locked) {
                    nodeBg = 'rgba(255,255,255,0.25)';
                    iconColor = 'rgba(255,255,255,0.7)';
                  } else if (lesson.done) {
                    nodeBg = '#FFC800';
                    iconColor = '#B8860B';
                  } else if (isCurrent) {
                    nodeBg = '#1CB0F6';
                    iconColor = '#fff';
                  }

                  const RING_SIZE = NODE_RADIUS * 2 + 20;

                  return (
                    <React.Fragment key={item.key}>
                      {banner}
                      <View style={[styles.nodeAbsoluteContainer, { left: pos.x - NODE_RADIUS, top: pos.y - NODE_RADIUS }]}>
                        <View style={[styles.platform, { backgroundColor: lesson.locked ? 'rgba(255,255,255,0.10)' : `${nodeBg}30` }]} />

                        {isCurrent && (
                          <View style={{ position: 'absolute', width: RING_SIZE, height: RING_SIZE, left: -10, top: -10, alignItems: 'center', justifyContent: 'center' }}>
                            <ProgressRing size={RING_SIZE} strokeWidth={5} pct={nodePct} trackColor="rgba(255,255,255,0.30)" fillColor="#FFC800" />
                          </View>
                        )}

                        {isCurrent && (
                          <Animated.View
                            style={[styles.pulseRing, { backgroundColor: '#1CB0F6', transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
                          />
                        )}

                        <Pressable
                          onPress={() => setSelectedKey(isSelected ? null : item.key)}
                          style={({ pressed }) => [
                            styles.nodeCircle,
                            { backgroundColor: nodeBg, shadowColor: lesson.locked ? '#0d326b' : nodeBg, transform: [{ scale: pressed ? 0.95 : 1 }] },
                          ]}
                        >
                          {lesson.locked ? (
                            <LockIcon size={24} color={iconColor} />
                          ) : lesson.done ? (
                            <CheckIcon size={28} color={iconColor} />
                          ) : isCurrent ? (
                            <StarIcon color={iconColor} size={30} />
                          ) : (
                            getCategoryIcon(lesson.category, iconColor, 24)
                          )}
                        </Pressable>

                        <View style={styles.nodeLabelBox}>
                          {isCurrent && (
                            <View style={styles.startBadge}>
                              <Text style={styles.startBadgeText}>START</Text>
                            </View>
                          )}
                          <Text
                            style={[styles.nodeTitleText, isCurrent && styles.nodeTitleTextActive, lesson.locked && styles.nodeTitleTextLocked]}
                            numberOfLines={1}
                          >
                            {lesson.title}
                          </Text>
                        </View>
                      </View>
                    </React.Fragment>
                  );
                }

                // ── Module quiz checkpoint node ──
                const isSelected = selectedKey === item.key;
                let qBg = '#A855F7';
                let qIconColor = '#fff';
                if (item.locked) {
                  qBg = 'rgba(255,255,255,0.25)';
                  qIconColor = 'rgba(255,255,255,0.7)';
                } else if (item.done) {
                  qBg = '#FFC800';
                  qIconColor = '#B8860B';
                }

                return (
                  <View key={item.key} style={[styles.nodeAbsoluteContainer, { left: pos.x - NODE_RADIUS, top: pos.y - NODE_RADIUS }]}>
                    <View style={[styles.platform, { backgroundColor: item.locked ? 'rgba(255,255,255,0.10)' : `${qBg}30` }]} />
                    <Pressable
                      onPress={() => setSelectedKey(isSelected ? null : item.key)}
                      style={({ pressed }) => [
                        styles.nodeCircle,
                        { backgroundColor: qBg, shadowColor: qBg, transform: [{ scale: pressed ? 0.95 : 1 }] },
                      ]}
                    >
                      {item.locked ? <LockIcon size={24} color={qIconColor} /> : item.done ? <CheckIcon size={28} color={qIconColor} /> : <TrophyIcon size={28} color={qIconColor} />}
                    </Pressable>
                    <View style={styles.nodeLabelBox}>
                      <Text style={[styles.nodeTitleText, item.locked && styles.nodeTitleTextLocked]} numberOfLines={2}>
                        {item.moduleTitle} Quiz
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

        {selectedItem && (
          <View style={styles.overlayContainer}>
            <Pressable style={styles.backdrop} onPress={() => setSelectedKey(null)} />

            <View style={styles.bottomCard}>
              {selectedItem.type === 'lesson' ? (
                <>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconContainer, { backgroundColor: selectedItem.lesson.iconBg }]}>
                      {getCategoryIcon(selectedItem.lesson.category, selectedItem.lesson.color, 24)}
                    </View>
                    <View style={styles.cardHeaderMeta}>
                      <Text style={[styles.cardCategoryText, { color: selectedItem.lesson.color }]}>
                        {selectedItem.lesson.category.toUpperCase()}
                      </Text>
                      <Text style={styles.cardTitleText}>{selectedItem.lesson.title}</Text>
                    </View>
                    <Pressable style={styles.closeCardBtn} onPress={() => setSelectedKey(null)}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                        <Line x1="18" y1="6" x2="6" y2="18" />
                        <Line x1="6" y1="6" x2="18" y2="18" />
                      </Svg>
                    </Pressable>
                  </View>

                  <Text style={styles.cardDescText}>{selectedItem.lesson.desc}</Text>

                  <View style={styles.cardInfoRow}>
                    <View style={styles.cardInfoBadge}>
                      <Text style={styles.cardInfoBadgeText}>⏱️ {selectedItem.lesson.duration}</Text>
                    </View>
                    <View style={[styles.cardInfoBadge, { backgroundColor: '#EEF2FF' }]}>
                      <Text style={[styles.cardInfoBadgeText, { color: '#4338CA' }]}>
                        ⚡ Up to +{selectedItem.lesson.xp} XP
                      </Text>
                    </View>
                  </View>

                  {selectedItem.lesson.has_quiz && (
                    <Pressable
                      style={styles.attemptHistoryBtn}
                      onPress={() => {
                        setSelectedKey(null);
                        router.push(`/lesson/history/${selectedItem.lesson.id}` as any);
                      }}
                    >
                      <Text style={styles.attemptHistoryBtnText}>📊 Attempt History</Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => {
                      setSelectedKey(null);
                      router.push(`/lesson/${selectedItem.lesson.id}` as any);
                    }}
                    style={[styles.cardActionBtn, { backgroundColor: selectedItem.lesson.locked ? '#CBD5E1' : selectedItem.lesson.color }]}
                    disabled={selectedItem.lesson.locked}
                  >
                    <Text style={styles.cardActionBtnText}>
                      {selectedItem.lesson.locked ? "🔒 LOCKED" : selectedItem.lesson.done ? "🔄 REVIEW LESSON" : "🚀 START LESSON"}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconContainer, { backgroundColor: '#F5F3FF' }]}>
                      <TrophyIcon size={24} color="#A855F7" />
                    </View>
                    <View style={styles.cardHeaderMeta}>
                      <Text style={[styles.cardCategoryText, { color: '#A855F7' }]}>MODULE QUIZ</Text>
                      <Text style={styles.cardTitleText}>{selectedItem.moduleTitle}</Text>
                    </View>
                    <Pressable style={styles.closeCardBtn} onPress={() => setSelectedKey(null)}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                        <Line x1="18" y1="6" x2="6" y2="18" />
                        <Line x1="6" y1="6" x2="18" y2="18" />
                      </Svg>
                    </Pressable>
                  </View>

                  <Text style={styles.cardDescText}>
                    10 random questions (multiple choice & true/false) pulled from every lesson in this module. Pass it to unlock the next module.
                  </Text>

                  {selectedItem.module.quiz_score != null && (
                    <View style={styles.cardInfoRow}>
                      <View style={[styles.cardInfoBadge, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.cardInfoBadgeText, { color: '#92400E' }]}>
                          🏆 Best score: {selectedItem.module.quiz_score}%
                        </Text>
                      </View>
                    </View>
                  )}

                  <Pressable
                    onPress={() => {
                      if (selectedItem.locked) return;
                      setSelectedKey(null);
                      router.push(`/module-quiz/${selectedItem.module.module_id}` as any);
                    }}
                    style={[styles.cardActionBtn, { backgroundColor: selectedItem.locked ? '#CBD5E1' : '#A855F7' }]}
                    disabled={selectedItem.locked}
                  >
                    <Text style={styles.cardActionBtnText}>
                      {selectedItem.locked ? "🔒 COMPLETE ALL LESSONS FIRST" : selectedItem.done ? "🔄 RETAKE QUIZ" : "🏆 START QUIZ"}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d326b' },
  container: { flex: 1, backgroundColor: 'transparent' },
  cloudLayer: { position: 'absolute', top: 0, left: 0, right: 0, height: screenHeight * 0.4, overflow: 'hidden', zIndex: 0 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 8 : 16, paddingBottom: 8, zIndex: 5 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpTopBadge: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  xpTopText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  streakBadge: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  unitBanner: { marginHorizontal: 16, marginTop: 8, marginBottom: 4, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, padding: 16, shadowColor: '#0d326b', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4, zIndex: 5 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTitleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  unitTitle: { color: '#0f3172', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 2 },
  unitDesc: { color: '#64748B', fontSize: 11, textAlign: 'center', fontWeight: '500' },
  arrowButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  arrowButtonDisabled: { backgroundColor: '#E2E8F0', shadowOpacity: 0, elevation: 0 },

  progressSection: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  progressTrack: { backgroundColor: '#E2E8F0', borderRadius: 12, height: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FCD34D', borderRadius: 12, shadowColor: '#FCD34D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 6 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressText: { color: '#64748B', fontSize: 11, fontWeight: '600' },

  mapContainer: { flex: 1, marginTop: 10, zIndex: 2 },

  startMarker: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  startFlag: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 99, paddingVertical: 6, paddingHorizontal: 16, borderWidth: 2, borderColor: '#FBBF24' },
  startFlagText: { fontSize: 12, fontWeight: '900', color: '#0f3172', letterSpacing: 0.5 },

  finishMarker: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  finishBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FBBF24', marginBottom: 4, shadowColor: '#FBBF24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
  finishBadgeText: { fontSize: 26 },
  finishLabel: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },

  // Module divider banner shown inline along the path between modules
  moduleBanner: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 4 },
  moduleBannerText: {
    backgroundColor: 'rgba(13,50,107,0.85)',
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: 'rgba(252,211,77,0.5)',
    overflow: 'hidden',
  },

  nodeAbsoluteContainer: { position: 'absolute', width: NODE_RADIUS * 2, height: NODE_RADIUS * 2, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  platform: { position: 'absolute', bottom: -6, width: NODE_RADIUS * 2.3, height: NODE_RADIUS * 0.9, borderRadius: 999 },
  nodeCircle: { width: NODE_RADIUS * 2, height: NODE_RADIUS * 2, borderRadius: NODE_RADIUS, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.95)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  pulseRing: { position: 'absolute', width: NODE_RADIUS * 2, height: NODE_RADIUS * 2, borderRadius: NODE_RADIUS, zIndex: -1 },
  nodeLabelBox: { position: 'absolute', top: NODE_RADIUS * 2 + 6, width: 140, alignItems: 'center' },
  startBadge: { backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 12, marginBottom: 4, borderWidth: 2, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  startBadgeText: { fontSize: 11, fontWeight: '900', color: '#1CB0F6', letterSpacing: 0.5 },
  nodeTitleText: { fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center' },
  nodeTitleTextActive: { color: '#fff', fontWeight: '900' },
  nodeTitleTextLocked: { color: 'rgba(255,255,255,0.5)' },

  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 120 },
  loaderText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#fff' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 100 },
  emptyIllustrationBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 8 },
  emptySubText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  emptyRefreshBtn: { backgroundColor: '#fbbf24', paddingVertical: 10, paddingHorizontal: 28, borderRadius: 20 },
  emptyRefreshBtnText: { color: '#78350f', fontWeight: '800', fontSize: 14 },

  mascotContainer: { position: 'absolute', alignItems: 'center', zIndex: 12, width: 85 },
  mascotImage: { width: 60, height: 60 },
  mascotBubble: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 2, borderColor: '#2563EB', marginTop: 2 },
  mascotBubbleText: { fontSize: 9, fontWeight: '900', color: '#2563EB', textAlign: 'center' },

  overlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', zIndex: 999 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 50, 107, 0.4)' },
  bottomCard: { width: screenWidth - 32, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#0d326b', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIconContainer: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardHeaderMeta: { flex: 1, marginLeft: 12 },
  cardCategoryText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  cardTitleText: { fontSize: 18, fontWeight: '900', color: '#0f3172', marginTop: 1 },
  closeCardBtn: { padding: 6, backgroundColor: '#F1F5F9', borderRadius: 12 },
  cardDescText: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 16 },
  cardInfoRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  cardInfoBadge: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 5, paddingHorizontal: 12 },
  cardInfoBadgeText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  cardActionBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  cardActionBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  attemptHistoryBtn: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE', borderRadius: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  attemptHistoryBtnText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
});