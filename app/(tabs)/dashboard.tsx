// app/(tabs)/dashboard.tsx
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
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { api } from '../../services/api';

// Module-level flag — survives tab switches, resets only on app restart
let practiceAdDismissed = false;

const { width: screenWidth } = Dimensions.get('window');

// Types
interface Lesson {
  lesson_id: number;
  title: string;
  description: string;
  lesson_type: string;
  difficulty: string;
  status: string;
  assigned_at: string;
  has_quiz: boolean;
  total_steps: number;
  is_locked?: boolean;
  score?: number | null;
  progress: {
    current_step: number;
    lesson_completed: boolean;
    quiz_completed: boolean;
    quiz_score: number | null;
  } | null;
}

// ── Quick navigation grid — 8 shortcuts, inspired by the reference layout ──
const quickActions = [
  { label: "Multiple Choice", icon: require('../../assets/images/img/multiple_choice.png'), color: "#2563EB", screen: "/quiz/mc" },
  { label: "Drag & Drop", icon: require('../../assets/images/img/dragNdrop.png'), color: "#059669", screen: "/quiz/dnd" },
  { label: "Gesture Cam", icon: require('../../assets/images/img/camera.png'), color: "#0f3172", screen: "/(tabs)/gesture" },
  { label: "My Badges", icon: require('../../assets/images/img/badges.png'), color: "#F59E0B", screen: "/(tabs)/achievements" },
  { label: "Alphabet", icon: require('../../assets/images/img/alphabet.png'), color: "#8B5CF6", screen: "/lessons" },
  { label: "Numbers", icon: require('../../assets/images/img/numbers.png'), color: "#DB2777", screen: "/lessons" },
  { label: "Greetings", icon: require('../../assets/images/img/greetings.png'), color: "#0EA5E9", screen: "/lessons" },
  { label: "All Lessons", icon: require('../../assets/images/img/lesson.png'), color: "#DC2626", screen: "/lessons" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
}

// Map lesson type to icon - using only existing assets
const getLessonIcon = (lessonType: string): any => {
  const iconMap: Record<string, any> = {
    'alphabet': require('../../assets/images/img/alphabet.png'),
    'greetings': require('../../assets/images/img/greetings.png'),
    'greet': require('../../assets/images/img/greet.png'),
    'numbers': require('../../assets/images/img/numbers.png'),
    'classroom': require('../../assets/images/img/classroom.png'),
    'conversation': require('../../assets/images/img/conversation.png'),
    'gesture': require('../../assets/images/img/camera.png'),
    'lesson': require('../../assets/images/img/lesson.png'),
    'badge': require('../../assets/images/img/badges.png'),
  };
  return iconMap[lessonType?.toLowerCase()] || null;
};

// Get status tag
const getStatusTag = (status: string, progress: any): string => {
  if (status === 'completed' || progress?.lesson_completed) return 'Completed';
  if (status === 'in_progress' || (progress && progress.current_step > 0)) return 'In Progress';
  return 'Pending';
};

// ── Cloud shape variants — same motif used across splash/login/onboarding/role ──
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

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [studentName, setStudentName] = useState<string>('Student');
  const [studentLevel, setStudentLevel] = useState<string>('Beginner');
  const [xp, setXp] = useState<number>(0);
  const [xpMax, setXpMax] = useState<number>(100);
  const [streak, setStreak] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [teacherLessons, setTeacherLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(true);
  const flatListRef = useRef<FlatList>(null);
  const [levelName, setLevelName] = useState<string>('Novice Signer');
  const [showPracticeAd, setShowPracticeAd] = useState<boolean>(!practiceAdDismissed);
  const adSlideAnim = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    fetchStudentData();
    fetchTeacherLessons();
  }, []);

  useEffect(() => {
    if (showPracticeAd) {
      Animated.spring(adSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start();
    }
  }, [showPracticeAd]);

  const dismissPracticeAd = () => {
    Animated.timing(adSlideAnim, {
      toValue: 160,
      duration: 260,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      practiceAdDismissed = true;
      setShowPracticeAd(false);
    });
  };

  const handleStartDailyChallenge = () => {
    // Find current active / first uncompleted teacher-provided lesson
    const currentLesson = teacherLessons.find(lesson => {
      const isLocked = lesson.is_locked === true || lesson.status === 'locked';
      const isCompleted = lesson.status === 'completed' || lesson.progress?.lesson_completed;
      return !isLocked && !isCompleted;
    }) || teacherLessons[0];

    const targetId = currentLesson?.lesson_id;
    if (targetId) {
      router.push(`/lesson/${targetId}`);
    } else {
      router.push('/lessons');
    }
  };

  const fetchStudentData = async (): Promise<void> => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        const student = user.student;
        const firstName = student?.first_name?.trim() || 'Student';
        setStudentName(firstName);
        setStudentLevel(student?.fsl_mastery_level || 'Beginner');

        if (student?.total_xp !== undefined && student?.total_xp !== null) {
          setXp(student.total_xp);
        }
        if (student?.streak_days !== undefined && student?.streak_days !== null) {
          setStreak(student.streak_days);
        }
        if (student?.level !== undefined && student?.level !== null) {
          setLevel(student.level);
        }
        if (student?.level_name) {
          setLevelName(student.level_name);
        }

        const levelXpMap: Record<number, number> = {
          1: 100,
          2: 250,
          3: 500,
          4: 800,
          5: 1200,
        };
        const maxXp = levelXpMap[student?.level || 1] || 100;
        setXpMax(maxXp);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherLessons = async (): Promise<void> => {
    try {
      setLoadingLessons(true);
      const response = await api.getAllLessons();

      if (response.success) {
        const allLessons = response.lessons || [];
        setTeacherLessons(allLessons);

        if (response.student) {
          if (response.student.total_xp !== undefined && response.student.total_xp !== null) {
            setXp(response.student.total_xp);
          }
          if (response.student.streak_days !== undefined && response.student.streak_days !== null) {
            setStreak(response.student.streak_days);
          }
          if (response.student.level !== undefined && response.student.level !== null) {
            setLevel(response.student.level);
          }
          if (response.student.level_name) {
            setLevelName(response.student.level_name);
          }

          const levelXpMap: Record<number, number> = {
            1: 100,
            2: 250,
            3: 500,
            4: 800,
            5: 1200,
          };
          const maxXp = levelXpMap[response.student.level || 1] || 100;
          setXpMax(maxXp);

          if (response.student.fsl_mastery_level) {
            setStudentLevel(response.student.fsl_mastery_level);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching teacher lessons:', error);
    } finally {
      setLoadingLessons(false);
    }
  };

  const getLessonStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#f59e0b';
      default: return '#2563EB';
    }
  };

  const renderTeacherLesson = ({ item }: { item: Lesson }) => {
    const progress = item.progress;
    const progressPercent = progress && item.total_steps > 0
      ? Math.round((progress.current_step / item.total_steps) * 100)
      : 0;

    const statusColor = getLessonStatusColor(item.status);
    const isCompleted = item.status === 'completed' || progress?.lesson_completed;
    const isPerfect = progress?.quiz_score === 100;

    return (
      <Pressable
        style={styles.teacherLessonCard}
        onPress={() => router.push(`/lesson/${item.lesson_id}`)}
      >
        <View style={styles.tlMainContent}>
          <View style={styles.tlIconBox}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </Svg>
          </View>

          <View style={styles.tlTextContent}>
            <View style={styles.tlHeaderRow}>
              <View style={styles.tlBadgeRow}>
                <View style={[styles.tlDifficultyTag, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={styles.tlDifficultyText}>
                    {item.difficulty ? item.difficulty.toUpperCase() : 'LESSON'}
                  </Text>
                </View>
                {item.has_quiz && (
                  <View style={[styles.tlDifficultyTag, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.tlDifficultyText, { color: '#059669' }]}>📝 QUIZ</Text>
                  </View>
                )}
              </View>
              {progress?.quiz_completed && progress?.quiz_score !== null ? (
                <View style={[styles.tlMiniScoreBadge, { backgroundColor: isPerfect ? '#FEF3C7' : '#D1FAE5' }]}>
                  <Text style={[styles.tlMiniScoreText, { color: isPerfect ? '#D97706' : '#059669' }]}>
                    {isPerfect ? '🌟 ' : ''}{progress.quiz_score}%
                  </Text>
                </View>
              ) : (
                <Text style={styles.tlDateText}>
                  {item.assigned_at ? new Date(item.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not assigned'}
                </Text>
              )}
            </View>

            <Text style={styles.tlTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </View>

        <View style={styles.tlProgressSection}>
          <View style={styles.tlProgressTrack}>
            <View
              style={[
                styles.tlProgressFill,
                { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: statusColor },
              ]}
            />
          </View>
          <View style={styles.tlProgressInfoRow}>
            <Text style={styles.tlProgressInfoText}>{Math.min(progressPercent, 100)}% completed</Text>
            <Text style={styles.tlProgressInfoText}>{item.total_steps || 0} steps</Text>
          </View>
        </View>

        <View style={styles.tlButtonSection}>
          <Pressable
            style={[styles.tlCardActionBtn, { backgroundColor: statusColor }]}
            onPress={() => router.push(`/lesson/${item.lesson_id}`)}
          >
            <Text style={styles.tlCardActionBtnText}>
              {isCompleted ? 'Review' : progressPercent > 0 ? 'Continue' : 'Start'}
            </Text>
          </Pressable>

          {item.has_quiz && (
            <Pressable
              style={styles.tlCardHistoryBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                router.push(`/lesson/history/${item.lesson_id}` as any);
              }}
            >
              <Text style={styles.tlCardHistoryBtnText}>Attempts</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  const xpPct = xpMax > 0 ? Math.min((xp / xpMax) * 100, 100) : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1E4F8A" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  const nextRecommendedLesson = teacherLessons
    .filter(lesson => {
      const isLocked = lesson.is_locked === true || lesson.status === 'locked';
      const isCompleted = lesson.status === 'completed' || lesson.progress?.lesson_completed;
      return !isLocked && !isCompleted;
    })

  const carouselLessons = teacherLessons
    .filter(lesson => {
      const isLocked = lesson.is_locked === true || lesson.status === 'locked';
      if (isLocked) return false;
      const isCompleted = lesson.status === 'completed' || lesson.progress?.lesson_completed;
      if (!isCompleted) return true;
      const score = lesson.score ?? lesson.progress?.quiz_score ?? 0;
      return score < 100;
    })
    .sort((a, b) => {
      const aCompleted = a.status === 'completed' || a.progress?.lesson_completed;
      const bCompleted = b.status === 'completed' || b.progress?.lesson_completed;
      if (!aCompleted && bCompleted) return -1;
      if (aCompleted && !bCompleted) return 1;
      return 0;
    });

  const completedLessons = teacherLessons
    .filter(lesson => lesson.status === 'completed' || lesson.progress?.lesson_completed)
    .slice(0, 3);

  const continueLearningLessons = completedLessons;
  const sectionTitle = continueLearningLessons.length > 0 ? 'Continue Learning' : 'Completed Lessons';

  const displayLessons = continueLearningLessons.length > 0 ? continueLearningLessons : completedLessons;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.logoText}>SEÑAS</Text>
          <View style={styles.topBarRight}>
            <View style={styles.streakBadge}>
              <Svg width="15" height="15" viewBox="0 0 24 24" fill="#fb923c">
                <Path d="M12 2c0 6-8 8-8 14a8 8 0 0016 0C20 10 12 8 12 2z" />
              </Svg>
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          </View>
        </View>

        {/* Hero + Level Card — same blue gradient & drifting clouds as splash/login/onboarding */}
        <View style={styles.section}>
          <View style={styles.heroCardWrapper}>
            <LinearGradient
              colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Drifting clouds, clipped to the card */}
              <DriftingCloud top={10} size={1.4} duration={20000} startX={0} opacity={0.20} variant={0} trackWidth={screenWidth - 32} />
              <DriftingCloud top={46} size={1.0} duration={16000} startX={screenWidth * 0.4} opacity={0.16} variant={2} trackWidth={screenWidth - 32} />

              {/* senya_clouds — background decoration pinned to bottom */}
              <Image
                source={require('../../assets/images/senya/senya_clouds.png')}
                style={styles.senyaCloudsBackground}
                contentFit="cover"
                contentPosition="bottom right"
                pointerEvents="none"
              />

              <View style={styles.heroContent}>
                <View style={styles.heroTextContent}>
                  <Text style={styles.greetingText}>{getGreeting()}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 1, marginBottom: 4 }}>
                    <Text style={styles.nameText}>{studentName}!</Text>
                    <View style={styles.smallBadgeBlue}>
                      <Svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24">
                        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </Svg>
                      <Text style={styles.smallBadgeTextBlue}>{studentLevel}</Text>
                    </View>
                  </View>
                  <Text style={styles.subtitleText}>Keep practicing and </Text>
                  <Text style={styles.subtitleText}>make progress every day!</Text>
                </View>
              </View>


              <View style={styles.levelSection}>
                <View style={styles.levelIconBox}>
                  <Image source={require('../../assets/images/img/level_1.png')} style={styles.levelIcon} contentFit="contain" />
                </View>
                <View style={styles.levelInfo}>
                  <View style={styles.levelHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.levelTag}>
                        <Text style={styles.levelTagText}>LEVEL {level}</Text>
                      </View>
                      <Text style={styles.levelTitle}>{levelName}</Text>
                    </View>
                    <Text style={styles.xpPctText}>{Math.round(xpPct)}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${xpPct}%` }]} />
                  </View>
                  <Text style={styles.xpStatusText}>{xp} / {xpMax} XP · {Math.max(0, xpMax - xp)} XP to next level</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions — easy navigation grid, inspired by the reference layout */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
          </View>
          <View style={styles.quickGrid}>
            {quickActions.map((q, i) => (
              <Pressable key={i} style={styles.quickItem} onPress={() => router.push(q.screen as any)}>
                <View style={[styles.quickIconBox, { backgroundColor: `${q.color}18` }]}>
                  <Image source={q.icon} style={styles.quickIcon} contentFit="contain" />
                </View>
                <Text style={styles.quickText} numberOfLines={1}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>




        {/* Continue Learning Section */}
        {displayLessons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>
              <Pressable onPress={() => router.push('/lessons')}>
                <Text style={styles.seeAllText}>See All →</Text>
              </Pressable>
            </View>

            <View style={styles.lessonsList}>
              {displayLessons.map((lesson) => {
                const progress = lesson.progress;
                const progressPercent = progress && lesson.total_steps > 0
                  ? Math.round((progress.current_step / lesson.total_steps) * 100)
                  : 0;
                const statusTag = getStatusTag(lesson.status, progress);
                const isLocked = statusTag === 'Pending' && progressPercent === 0;
                const isCompleted = statusTag === 'Completed';
                const icon = getLessonIcon(lesson.lesson_type);

                return (
                  <Pressable
                    key={lesson.lesson_id}
                    style={[styles.lessonCard, isLocked && { opacity: 0.5 }]}
                    disabled={isLocked}
                    onPress={() => router.push(`/lesson/${lesson.lesson_id}`)}
                  >
                    <View style={[styles.lessonIconBox, { backgroundColor: isLocked ? 'rgba(15,49,114,0.06)' : 'rgba(37,99,235,0.10)' }]}>
                      {isCompleted ? (
                        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                          <Polyline points="20 6 9 17 4 12" />
                        </Svg>
                      ) : isLocked ? (
                        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                          <Rect x="3" y="11" width="18" height="11" rx="2" />
                          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </Svg>
                      ) : icon ? (
                        <Image source={icon} style={styles.lessonIcon} contentFit="contain" />
                      ) : (
                        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                          <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </Svg>
                      )}
                    </View>
                    <View style={styles.lessonInfo}>
                      <View style={styles.lessonRow}>
                        <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                        <View style={[styles.lessonTag, {
                          backgroundColor: isCompleted ? 'rgba(37,99,235,0.12)' :
                            isLocked ? 'rgba(15,49,114,0.07)' :
                              'rgba(251,191,36,0.18)'
                        }]}>
                          <Text style={[styles.lessonTagText, {
                            color: isCompleted ? '#1848c8' :
                              isLocked ? '#6B7280' :
                                '#92400E'
                          }]}>
                            {statusTag}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.lessonProgressTrack}>
                        <View style={[styles.lessonProgressFill, {
                          width: `${Math.min(progressPercent, 100)}%`,
                          backgroundColor: isCompleted ? '#2563EB' : '#f59e0b'
                        }]} />
                      </View>
                      <Text style={styles.lessonProgressText}>{Math.min(progressPercent, 100)}% complete</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Practice Your Signs — floating ad banner above tab bar */}
      {showPracticeAd && (
        <Animated.View
          style={[
            styles.adBannerWrapper,
            { transform: [{ translateY: adSlideAnim }] },
          ]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.adBanner} onPress={handleStartDailyChallenge}>
            {/* Close button */}
            <Pressable style={styles.adCloseBtn} onPress={dismissPracticeAd} hitSlop={10}>
              <Svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <Line x1="18" y1="6" x2="6" y2="18" />
                <Line x1="6" y1="6" x2="18" y2="18" />
              </Svg>
            </Pressable>

            {/* Left: icon + label */}
            <View style={styles.adIconBox}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
                <Circle cx="12" cy="12" r="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                <Circle cx="12" cy="12" r="2" fill="#fff" />
              </Svg>
            </View>

            {/* Center: text */}
            <View style={styles.adTextBox}>
              <Text style={styles.adTopLabel}>DAILY CHALLENGE  ·  +50 XP</Text>
              <Text style={styles.adTitle}>Practice Your Signs</Text>
              <Text style={styles.adDesc}>Complete a lesson {'&'} earn your streak bonus!</Text>
            </View>

            {/* Right: CTA button */}
            <Pressable style={styles.adCtaBtn} onPress={handleStartDailyChallenge}>
              <Text style={styles.adCtaText}>Start</Text>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="3">
                <Line x1="5" y1="12" x2="19" y2="12" /><Polyline points="12 5 19 12 12 19" />
              </Svg>
            </Pressable>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff' },
  scrollContent: { paddingBottom: 100 },

  // ── Floating Practice Ad Banner ──
  adBannerWrapper: {
    position: 'absolute',
    bottom: 10, // sits snugly just above the tab bar
    left: 12,
    right: 12,
    zIndex: 999,
    shadowColor: '#0d326b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
  },
  adBanner: {
    backgroundColor: '#1e4b8f',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  adCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  adIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adTextBox: {
    flex: 1,
    paddingRight: 4,
  },
  adTopLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fde68a',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  adTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  adDesc: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  adCtaBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    marginTop: 18,
    alignSelf: 'flex-end',
  },
  adCtaText: {
    color: '#78350f',
    fontWeight: '800',
    fontSize: 13,
  },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, color: '#666' },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  logoText: { color: '#0f3172', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakBadge: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  streakText: { color: '#0f3172', fontSize: 13, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 14 },

  // Hero + Level — gradient card
  heroCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0d326b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  heroCard: { padding: 18, overflow: 'hidden' },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between' },
  heroTextContent: { flex: 1, paddingRight: 8 },
  greetingText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' },
  nameText: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 1, marginBottom: 4 },
  subtitleText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500', marginBottom: 0 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  smallBadgeBlue: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallBadgeTextBlue: { fontSize: 11, fontWeight: '700', color: '#fff' },
  smallBadgeOrange: { backgroundColor: 'rgba(251,191,36,0.20)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallBadgeTextOrange: { fontSize: 11, fontWeight: '700', color: '#fde68a' },
  senyaHero: { width: 100, height: 100, marginTop: -6 },
  senyaCloudsBackground: {
    position: 'absolute',
    bottom: -18,
    left: -18,
    right: -18,
    height: 240,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: 14 },
  levelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  levelIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIcon: { width: 38, height: 38 },
  levelInfo: { flex: 1 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  levelTag: {
    backgroundColor: '#2563EB',
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginRight: 6,
  },
  levelTagText: { fontSize: 9.5, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  levelTitle: { fontSize: 14, fontWeight: '800', color: '#0f3172' },
  xpPctText: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
  progressTrack: { backgroundColor: '#eff6ff', borderRadius: 99, height: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 99 },
  xpStatusText: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 4 },

  dailyCard: { backgroundColor: '#2563EB', borderRadius: 20, padding: 20, shadowColor: '#0f3172', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 24, elevation: 8 },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dailyIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  dailyLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.75)', letterSpacing: 1 },
  dailyXpBadge: { marginLeft: 'auto', backgroundColor: 'rgba(251,191,36,0.25)', borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10 },
  dailyXpText: { fontSize: 11, fontWeight: '800', color: '#fde68a' },
  dailyContent: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dailyTextContent: { flex: 1, paddingRight: 12 },
  dailyTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6 },
  dailyDesc: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500', lineHeight: 18 },
  dailyDots: { flexDirection: 'row', gap: 5, marginTop: 12 },
  dailyDot: { width: 28, height: 6, borderRadius: 99 },
  dailyStatusText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 5 },
  dailyActionBox: { alignItems: 'center', gap: 10 },
  dailyStartBtn: { backgroundColor: '#fbbf24', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dailyStartText: { color: '#78350f', fontWeight: '800', fontSize: 14 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f3172' },
  seeAllText: { color: '#2563EB', fontSize: 13, fontWeight: '700', paddingVertical: 4 },

  // Continue Learning styles
  lessonsList: { gap: 10 },
  lessonCard: { backgroundColor: 'rgba(255,255,255,0.62)', borderColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  lessonIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lessonIcon: { width: 36, height: 36 },
  lessonInfo: { flex: 1 },
  lessonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  lessonTitle: { fontSize: 14, fontWeight: '700', color: '#0f3172', flex: 1 },
  lessonTag: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 99 },
  lessonTagText: { fontSize: 10, fontWeight: '700' },
  lessonProgressTrack: { backgroundColor: 'rgba(15,49,114,0.10)', borderRadius: 99, height: 5, marginTop: 7, overflow: 'hidden' },
  lessonProgressFill: { height: '100%', borderRadius: 99 },
  lessonProgressText: { fontSize: 10, color: '#4b7bbb', marginTop: 3, fontWeight: '600' },

  // Quick Actions grid — flat colorful circle + label, no card, inspired by the reference
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  quickItem: { width: '25%', alignItems: 'center', gap: 6 },
  quickIconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  quickIcon: { width: 45, height: 45 },
  quickText: { fontSize: 10.5, fontWeight: '700', color: '#0f3172', textAlign: 'center' },

  // Teacher Lesson Cards
  teacherLessonsCarousel: {
    paddingRight: 16,
    gap: 12,
  },
  teacherLessonCard: {
    width: screenWidth * 0.78,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  tlMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tlIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(37,99,235,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlTextContent: {
    flex: 1,
  },
  tlHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tlBadgeRow: {
    flexDirection: 'row',
    gap: 5,
  },
  tlDifficultyTag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tlDifficultyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  tlMiniScoreBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tlMiniScoreText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tlDateText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tlTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f3172',
    lineHeight: 18,
  },
  tlProgressSection: {
    marginBottom: 14,
  },
  tlProgressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 99,
    overflow: 'hidden',
  },
  tlProgressFill: {
    height: '100%',
    borderRadius: 99,
  },
  tlProgressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tlProgressInfoText: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  tlButtonSection: {
    flexDirection: 'row',
    gap: 8,
  },
  tlCardActionBtn: {
    flex: 1.3,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tlCardActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  tlCardHistoryBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlCardHistoryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },

  emptyLessons: {
    width: screenWidth * 0.75,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EAECF0',
    borderStyle: 'dashed',
  },
  emptyLessonsText: {
    fontSize: 14,
    color: '#9AA1B0',
    fontWeight: '600',
  },
});