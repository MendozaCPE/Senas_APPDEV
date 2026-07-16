// app/(tabs)/lessons.tsx
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

// Mascot asset path
const MascotImage = require('../../assets/images/img/senyas_logo.png');

// ── Design Geometry Constants ──────────────────────────────────────────
const NODE_ROW_HEIGHT = 150;
const NODE_RADIUS = 38;
const HORIZ_PADDING = 50;
const MAP_WIDTH = screenWidth - HORIZ_PADDING * 2;
const TOP_PADDING = 130;    // space above the last (highest-level) node — room for the finish banner
const BOTTOM_PADDING = 140; // space below the first node — room for the start marker

// Vibrant, kid-friendly accent colors for unlocked/completed nodes
const ACCENT_COLORS = [
  '#FF6B6B',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#06B6D4',
  '#E11D48',
];

// Level path zigzags left/right like a Candy-Crush-style board.
// Index 0 sits at the BOTTOM of the map; higher indices climb upward.
const getNodePosition = (index: number, total: number) => {
  const cycle = [0.5, 0.76, 0.5, 0.24];
  const xPct = cycle[index % cycle.length];
  const x = HORIZ_PADDING + MAP_WIDTH * xPct;
  const contentHeight = total * NODE_ROW_HEIGHT + TOP_PADDING + BOTTOM_PADDING;
  const y = contentHeight - BOTTOM_PADDING - (index * NODE_ROW_HEIGHT + NODE_ROW_HEIGHT / 2);
  return { x, y };
};

const getContentHeight = (total: number) => total * NODE_ROW_HEIGHT + TOP_PADDING + BOTTOM_PADDING;

// Custom Play Icon
function PlayIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

// Duolingo-style star for the current lesson
function StarIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2.5l2.86 6.24 6.86.66-5.2 4.6 1.56 6.75L12 17.02l-6.08 3.73 1.56-6.75-5.2-4.6 6.86-.66L12 2.5z" />
    </Svg>
  );
}

// Progress ring drawn around the current lesson's node, showing % completion
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
          cx={cx}
          cy={cy}
          r={r}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
    </Svg>
  );
}

// ── Cloud shape variants — same motif used across splash/login/onboarding/dashboard ──
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

// Small twinkling sparkle dots scattered on the map for a candy-crush-y feel
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

  // Deterministic pseudo-random scatter based on a seed
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
            position: 'absolute',
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            borderRadius: d.size / 2,
            backgroundColor: '#ffffff',
            opacity,
          }}
        />
      ))}
    </View>
  );
}

// Generate smooth cubic bezier S-curve path
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

// Dynamic Category Icon Resolver
const getCategoryIcon = (category: string, color: string, size: number = 24) => {
  const cleanCat = category.toLowerCase();
  if (cleanCat.includes('greet')) {
    return <GreetingIcon size={size} color={color} />;
  } else if (cleanCat.includes('alpha') || cleanCat.includes('letter')) {
    return <AlphabetIcon size={size} color={color} />;
  } else if (cleanCat.includes('number') || cleanCat.includes('count')) {
    return <NumbersIcon size={size} color={color} />;
  } else {
    return <BookIcon size={size} color={color} />;
  }
};

// ── MOCK DATA ──────────────────────────────────────────────────────────
const defaultLessonsData = [
  {
    id: 1,
    category: "Greetings",
    title: "Hello & Goodbye",
    desc: "Essential everyday greetings in FSL",
    color: "#FF6B6B",
    iconBg: "#FFEBEB",
    duration: "4 min",
    xp: 15,
    done: true,
    active: false,
    locked: false,
    progressPercent: 100
  },
  {
    id: 2,
    category: "Alphabet",
    title: "Letters A–E",
    desc: "Learn the first 5 letters of the FSL alphabet",
    color: "#8B5CF6",
    iconBg: "#F5F3FF",
    duration: "5 min",
    xp: 20,
    done: true,
    active: false,
    locked: false,
    progressPercent: 100
  },
  {
    id: 3,
    category: "Greetings",
    title: "Thank You & Please",
    desc: "Polite expressions used in everyday conversations",
    color: "#10B981",
    iconBg: "#ECFDF5",
    duration: "4 min",
    xp: 15,
    done: false,
    active: true,
    locked: false,
    progressPercent: 40
  },
  {
    id: 4,
    category: "Numbers",
    title: "Numbers 1–5",
    desc: "Count from one to five in FSL",
    color: "#F59E0B",
    iconBg: "#FEF3C7",
    duration: "6 min",
    xp: 25,
    done: false,
    active: false,
    locked: true,
    progressPercent: 0
  },
  {
    id: 5,
    category: "Alphabet",
    title: "Letters F–J",
    desc: "Continue with the next 5 alphabet signs",
    color: "#EC4899",
    iconBg: "#FDF2F8",
    duration: "5 min",
    xp: 20,
    done: false,
    active: false,
    locked: true,
    progressPercent: 0
  },
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
}

export default function Lessons() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [streak, setStreak] = useState<number>(12);
  const [xp, setXp] = useState<number>(150);

  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  const scrollRef = useRef<ScrollView>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const tabFadeAnim = useRef(new Animated.Value(1)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  // Pulse loop for active checkpoint
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Bobbing loop for waving mascot
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

            // Progress ring value: prefer real step progress, fall back to a sensible default per status
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
              color: color,
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

  const getCurrentLessons = (): Lesson[] => {
    if (activeTab === 0) {
      return defaultLessonsData;
    }
    if (modules.length === 0 || currentModuleIndex >= modules.length) {
      return [];
    }
    const currentModule = modules[currentModuleIndex];
    return currentModule.lessons || [];
  };

  const currentLessons = getCurrentLessons();
  const totalNodes = currentLessons.length;

  const getModuleDisplayName = (): string => {
    if (activeTab === 0) return "Unit 1: Basics";
    if (modules.length === 0 || currentModuleIndex >= modules.length) return "No Module";
    return modules[currentModuleIndex].title;
  };

  const getModuleDescription = (): string => {
    if (activeTab === 0) return "Master the alphabet and essential greetings";
    if (modules.length === 0 || currentModuleIndex >= modules.length) return "No lessons available";
    return modules[currentModuleIndex].description || "Complete the lessons in this module";
  };

  const getActivePathIndex = () => {
    let lastActiveOrDone = 0;
    for (let i = 0; i < currentLessons.length; i++) {
      if (currentLessons[i].done || currentLessons[i].active) {
        lastActiveOrDone = i;
      }
    }
    return lastActiveOrDone;
  };

  const activePathIndex = getActivePathIndex();

  // Node coordinates — index 0 anchored at the bottom, climbing upward
  const points = currentLessons.map((_, i) => getNodePosition(i, totalNodes));
  const contentHeight = getContentHeight(totalNodes);
  const backgroundPathD = generateSPath(points);
  const progressPathD = generateSPath(points.slice(0, activePathIndex + 1));

  // Auto-scroll to reveal current progress whenever the level list changes
  const scrollToActive = () => {
    if (!points[activePathIndex]) return;
    const targetY = Math.max(0, points[activePathIndex].y - screenHeight * 0.5);
    scrollRef.current?.scrollTo({ y: targetY, animated: false });
  };

  useEffect(() => {
    const t = setTimeout(scrollToActive, 60);
    return () => clearTimeout(t);
  }, [activeTab, currentModuleIndex, modules.length, loadingModules]);

  const switchTab = (targetTab: number) => {
    if (targetTab === activeTab || isNavigating) return;
    setIsNavigating(true);
    setExpandedId(null);
    setActiveTab(targetTab);
    if (targetTab === 1) setCurrentModuleIndex(0);

    Animated.sequence([
      Animated.timing(tabFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(tabFadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => setIsNavigating(false));
  };

  const navigateModule = (direction: 'prev' | 'next') => {
    if (modules.length === 0 || isNavigating) return;
    const newIndex = direction === 'prev'
      ? Math.max(0, currentModuleIndex - 1)
      : Math.min(modules.length - 1, currentModuleIndex + 1);

    if (newIndex !== currentModuleIndex) {
      setIsNavigating(true);
      setExpandedId(null);
      setCurrentModuleIndex(newIndex);

      Animated.sequence([
        Animated.timing(tabFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(tabFadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start(() => setIsNavigating(false));
    }
  };

  const getProgressPercentage = () => {
    if (totalNodes === 0) return 0;
    const completedCount = currentLessons.filter(l => l.done).length;
    return Math.round((completedCount / totalNodes) * 100);
  };

  const pct = getProgressPercentage();
  const completedNodesCount = currentLessons.filter(l => l.done).length;
  const selectedLesson = currentLessons.find(l => l.id === expandedId);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] });
  const bobY = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  const activePos = points[activePathIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Same blue gradient used across splash/login/onboarding/dashboard */}
      <LinearGradient
        colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Drifting clouds, pinned above the map */}
      <View style={styles.cloudLayer} pointerEvents="none">
        <DriftingCloud top={30} size={2.0} duration={26000} startX={0} opacity={0.22} variant={0} trackWidth={screenWidth} />
        <DriftingCloud top={90} size={1.4} duration={20000} startX={screenWidth * 0.5} opacity={0.16} variant={2} trackWidth={screenWidth} />
        <DriftingCloud top={150} size={1.7} duration={23000} startX={screenWidth * 0.2} opacity={0.14} variant={4} trackWidth={screenWidth} />
      </View>

      <View style={styles.container}>
        {/* Top Bar */}
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

        {/* Unit/Module Banner */}
        <View style={styles.unitBanner}>
          <View style={styles.bannerRow}>
            <Pressable
              style={[styles.arrowButton, (activeTab === 0 || isNavigating) && styles.arrowButtonDisabled]}
              onPress={() => {
                if (isNavigating) return;
                if (activeTab === 0) return;
                if (currentModuleIndex > 0) {
                  navigateModule('prev');
                } else {
                  switchTab(0);
                }
              }}
              disabled={activeTab === 0 || isNavigating}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab === 0 ? "#94A3B8" : "#fff"} strokeWidth="3">
                <Path d="M15 18l-6-6 6-6" />
              </Svg>
            </Pressable>

            <View style={styles.bannerTitleContainer}>
              <Text style={styles.unitTitle}>{getModuleDisplayName()}</Text>
              <Text style={styles.unitDesc}>{getModuleDescription()}</Text>

              {activeTab === 1 && modules.length > 1 && (
                <View style={styles.moduleDotsContainer}>
                  {modules.map((_, index) => (
                    <View
                      key={index}
                      style={[styles.moduleDot, currentModuleIndex === index && styles.moduleDotActive]}
                    />
                  ))}
                </View>
              )}
            </View>

            <Pressable
              style={[
                styles.arrowButton,
                ((activeTab === 1 && currentModuleIndex === modules.length - 1) || isNavigating) && styles.arrowButtonDisabled
              ]}
              onPress={() => {
                if (isNavigating) return;
                if (activeTab === 0) {
                  switchTab(1);
                } else if (currentModuleIndex < modules.length - 1) {
                  navigateModule('next');
                }
              }}
              disabled={(activeTab === 1 && currentModuleIndex === modules.length - 1) || isNavigating}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={
                (activeTab === 1 && currentModuleIndex === modules.length - 1) ? "#94A3B8" : "#fff"
              } strokeWidth="3">
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
                <Text style={styles.progressText}>{completedNodesCount} of {totalNodes} lessons done</Text>
                <Text style={styles.progressText}>{pct}% Completed</Text>
              </View>
            </View>
          )}
        </View>

        {/* Level Map — climbs from bottom (Level 1) to top (latest level) */}
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
                {activeTab === 0 ? "No Lessons Yet!" : "No Lessons in this Module"}
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === 0
                  ? "Your teacher hasn't uploaded any lessons yet. Check back later!"
                  : "This module doesn't have any lessons assigned yet."}
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
              {/* Sparkle decorations */}
              <SparkleField contentHeight={contentHeight} />

              {/* SVG Path Connections */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Svg width={screenWidth} height={contentHeight}>
                  {backgroundPathD !== '' && (
                    <Path
                      d={backgroundPathD}
                      fill="none"
                      stroke="rgba(255,255,255,0.28)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="8 12"
                    />
                  )}
                  {progressPathD !== '' && (
                    <>
                      <Path d={progressPathD} fill="none" stroke="#FCD34D" strokeWidth="12" strokeLinecap="round" opacity={0.25} />
                      <Path d={progressPathD} fill="none" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
                    </>
                  )}
                </Svg>
              </View>

              {/* Start marker — bottom of the map */}
              <View style={[styles.startMarker, { top: contentHeight - BOTTOM_PADDING * 0.42 }]} pointerEvents="none">
                <View style={styles.startFlag}>
                  <Text style={styles.startFlagText}>🏁 START</Text>
                </View>
              </View>

              {/* Finish marker — top of the map */}
              <View style={[styles.finishMarker, { top: TOP_PADDING * 0.28 }]} pointerEvents="none">
                <View style={styles.finishBadge}>
                  <Text style={styles.finishBadgeText}>🏆</Text>
                </View>
                <Text style={styles.finishLabel}>GOAL</Text>
              </View>

              {/* Bobbing Mascot */}
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

              {/* Checkpoint Nodes — Duolingo style: gold = done, blue star + ring = current, gray = locked */}
              {currentLessons.map((lesson, index) => {
                const pos = points[index];
                const isSelected = expandedId === lesson.id;
                const isCurrent = lesson.active && !lesson.locked;
                const pct = lesson.progressPercent ?? (lesson.done ? 100 : 0);

                // Duolingo palette: gold for completed, bright blue for the current lesson, gray for locked
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
                  <View
                    key={lesson.id}
                    style={[styles.nodeAbsoluteContainer, { left: pos.x - NODE_RADIUS, top: pos.y - NODE_RADIUS }]}
                  >
                    {/* Platform "tile" the checkpoint stands on */}
                    <View style={[styles.platform, { backgroundColor: lesson.locked ? 'rgba(255,255,255,0.10)' : `${nodeBg}30` }]} />

                    {/* Progress ring — only around the current, not-yet-finished lesson */}
                    {isCurrent && (
                      <View style={{ position: 'absolute', width: RING_SIZE, height: RING_SIZE, left: -10, top: -10, alignItems: 'center', justifyContent: 'center' }}>
                        <ProgressRing size={RING_SIZE} strokeWidth={5} pct={pct} trackColor="rgba(255,255,255,0.30)" fillColor="#FFC800" />
                      </View>
                    )}

                    {isCurrent && (
                      <Animated.View
                        style={[
                          styles.pulseRing,
                          { backgroundColor: '#1CB0F6', transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                        ]}
                      />
                    )}

                    <Pressable
                      onPress={() => setExpandedId(isSelected ? null : lesson.id)}
                      style={({ pressed }) => [
                        styles.nodeCircle,
                        {
                          backgroundColor: nodeBg,
                          shadowColor: lesson.locked ? '#0d326b' : nodeBg,
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                        },
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
                        style={[
                          styles.nodeTitleText,
                          isCurrent && styles.nodeTitleTextActive,
                          lesson.locked && styles.nodeTitleTextLocked,
                        ]}
                        numberOfLines={1}
                      >
                        {lesson.title}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

        {/* Floating Detail Sheet */}
        {selectedLesson && (
          <View style={styles.overlayContainer}>
            <Pressable style={styles.backdrop} onPress={() => setExpandedId(null)} />

            <View style={styles.bottomCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconContainer, { backgroundColor: selectedLesson.iconBg }]}>
                  {getCategoryIcon(selectedLesson.category, selectedLesson.color, 24)}
                </View>
                <View style={styles.cardHeaderMeta}>
                  <Text style={[styles.cardCategoryText, { color: selectedLesson.color }]}>
                    {selectedLesson.category.toUpperCase()}
                  </Text>
                  <Text style={styles.cardTitleText}>{selectedLesson.title}</Text>
                </View>
                <Pressable style={styles.closeCardBtn} onPress={() => setExpandedId(null)}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                    <Line x1="18" y1="6" x2="6" y2="18" />
                    <Line x1="6" y1="6" x2="18" y2="18" />
                  </Svg>
                </Pressable>
              </View>

              <Text style={styles.cardDescText}>{selectedLesson.desc}</Text>

              <View style={styles.cardInfoRow}>
                <View style={styles.cardInfoBadge}>
                  <Text style={styles.cardInfoBadgeText}>⏱️ {selectedLesson.duration}</Text>
                </View>
                <View style={[styles.cardInfoBadge, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.cardInfoBadgeText, { color: '#4338CA' }]}>
                    ⚡ Up to +{selectedLesson.xp} XP
                  </Text>
                </View>
              </View>

              {selectedLesson.has_quiz && (
                <Pressable
                  style={styles.attemptHistoryBtn}
                  onPress={() => {
                    setExpandedId(null);
                    router.push(`/lesson/history/${selectedLesson.id}` as any);
                  }}
                >
                  <Text style={styles.attemptHistoryBtnText}>📊 Attempt History</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  setExpandedId(null);
                  router.push(`/lesson/${selectedLesson.id}` as any);
                }}
                style={[
                  styles.cardActionBtn,
                  { backgroundColor: selectedLesson.locked ? '#CBD5E1' : selectedLesson.color },
                ]}
                disabled={selectedLesson.locked}
              >
                <Text style={styles.cardActionBtnText}>
                  {selectedLesson.locked ? "🔒 LOCKED" : selectedLesson.done ? "🔄 REVIEW LESSON" : "🚀 START LESSON"}
                </Text>
              </Pressable>
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
  cloudLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: screenHeight * 0.4,
    overflow: 'hidden',
    zIndex: 0,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 8,
    zIndex: 5,
  },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpTopBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  xpTopText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  streakBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  unitBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#0d326b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
    zIndex: 5,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTitleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  unitTitle: { color: '#0f3172', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 2 },
  unitDesc: { color: '#64748B', fontSize: 11, textAlign: 'center', fontWeight: '500' },
  arrowButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  arrowButtonDisabled: { backgroundColor: '#E2E8F0', shadowOpacity: 0, elevation: 0 },

  moduleDotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 4 },
  moduleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  moduleDotActive: { backgroundColor: '#2563EB', width: 16 },

  progressSection: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  progressTrack: { backgroundColor: '#E2E8F0', borderRadius: 12, height: 10, overflow: 'hidden' },
  progressFill: {
    height: '100%', backgroundColor: '#FCD34D', borderRadius: 12,
    shadowColor: '#FCD34D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressText: { color: '#64748B', fontSize: 11, fontWeight: '600' },

  mapContainer: { flex: 1, marginTop: 10, zIndex: 2 },

  startMarker: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  startFlag: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  startFlagText: { fontSize: 12, fontWeight: '900', color: '#0f3172', letterSpacing: 0.5 },

  finishMarker: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  finishBadge: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FBBF24',
    marginBottom: 4,
    shadowColor: '#FBBF24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  finishBadgeText: { fontSize: 26 },
  finishLabel: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },

  nodeAbsoluteContainer: {
    position: 'absolute',
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  platform: {
    position: 'absolute',
    bottom: -6,
    width: NODE_RADIUS * 2.3,
    height: NODE_RADIUS * 0.9,
    borderRadius: 999,
  },
  nodeCircle: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    zIndex: -1,
  },
  nodeLabelBox: {
    position: 'absolute',
    top: NODE_RADIUS * 2 + 6,
    width: 140,
    alignItems: 'center',
  },
  startBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  startBadgeText: { fontSize: 11, fontWeight: '900', color: '#1CB0F6', letterSpacing: 0.5 },
  nodeTitleText: { fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center' },
  nodeTitleTextActive: { color: '#fff', fontWeight: '900' },
  nodeTitleTextLocked: { color: 'rgba(255,255,255,0.5)' },

  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 120 },
  loaderText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#fff' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 100 },
  emptyIllustrationBox: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 8 },
  emptySubText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  emptyRefreshBtn: {
    backgroundColor: '#fbbf24',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  emptyRefreshBtnText: { color: '#78350f', fontWeight: '800', fontSize: 14 },

  mascotContainer: { position: 'absolute', alignItems: 'center', zIndex: 12, width: 85 },
  mascotImage: { width: 60, height: 60 },
  mascotBubble: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#2563EB',
    marginTop: 2,
  },
  mascotBubbleText: { fontSize: 9, fontWeight: '900', color: '#2563EB', textAlign: 'center' },

  overlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', zIndex: 999 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 50, 107, 0.4)' },
  bottomCard: {
    width: screenWidth - 32,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#0d326b',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
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
  cardActionBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardActionBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  attemptHistoryBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  attemptHistoryBtnText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
});