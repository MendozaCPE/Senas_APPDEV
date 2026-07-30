import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── SVG Icons ──────────────────────────────────────────────────────────
function ShareIcon({ size = 18, color = "#0f3172" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="18" cy="5" r="3" />
      <Circle cx="6" cy="12" r="3" />
      <Circle cx="18" cy="19" r="3" />
      <Path d="M8.59 13.51l6.83 3.98" />
      <Path d="M15.41 6.51l-6.82 3.98" />
    </Svg>
  );
}

function DownloadIcon({ size = 18, color = "#0f3172" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Polyline points="7 10 12 15 17 10" />
      <Path d="M12 15V3" />
    </Svg>
  );
}

function QuestionIcon({ size = 28, color = "#CBD5E1" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <Path d="M12 17h.01" />
    </Svg>
  );
}

function StarIcon({ size = 14, color = "#F59E0B" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function FlameIcon({ size = 14, color = "#fb923c" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2c0 6-8 8-8 14a8 8 0 0016 0C20 10 12 8 12 2z" />
    </Svg>
  );
}

function SparkleIcon({ size = 14, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </Svg>
  );
}

function TrophyIcon({ size = 20, color = "#0f3172" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 21h8" />
      <Path d="M12 17v4" />
      <Path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <Path d="M7 5H4a2 2 0 0 0 0 4h3" />
      <Path d="M17 5h3a2 2 0 0 1 0 4h-3" />
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

// ── Badge Definitions ──────────────────────────────────────────────────
const BADGE_DEFINITIONS = [
  { id: 'first_step', name: "First Step", image: require('../../assets/images/img/first_step.png'), desc: "Complete your first lesson", xpRequired: 0, gradient: ["#7DD3FC", "#38BDF8"], glow: "#0EA5E9" },
  { id: 'streak_starter', name: "Streak Starter", image: require('../../assets/images/img/streak1.png'), desc: "Practice 3 days in a row", xpRequired: 30, gradient: ["#FCA5A5", "#F87171"], glow: "#EF4444" },
  { id: 'alphabet_star', name: "Alphabet Star", image: require('../../assets/images/img/alphabet_star.png'), desc: "Learn all 26 FSL alphabet signs", xpRequired: 50, gradient: ["#FDE68A", "#FBBF24"], glow: "#F59E0B" },
  { id: 'number_ninja', name: "Number Ninja", image: require('../../assets/images/img/numbers.png'), desc: "Learn numbers 1–10", xpRequired: 80, gradient: ["#FDBA74", "#FB923C"], glow: "#F97316" },
  { id: 'greeter', name: "Greeter", image: require('../../assets/images/img/greetings.png'), desc: "Complete the Greetings module", xpRequired: 100, gradient: ["#67E8F9", "#22D3EE"], glow: "#06B6D4" },
  { id: 'quiz_whiz', name: "Quiz Whiz", image: require('../../assets/images/img/greetings.png'), desc: "Score 100% on any quiz", xpRequired: 150, gradient: ["#D8B4FE", "#C084FC"], glow: "#A855F7" },
  { id: 'sign_detective', name: "Sign Detective", image: require('../../assets/images/img/first_step.png'), desc: "Use gesture recognition 10 times", xpRequired: 200, gradient: ["#A5B4FC", "#818CF8"], glow: "#6366F1" },
  { id: 'week_warrior', name: "Week Warrior", image: require('../../assets/images/img/greetings.png'), desc: "7-day learning streak", xpRequired: 250, gradient: ["#F9A8D4", "#F472B6"], glow: "#EC4899" },
];

// ── Circular Badge Item Component ─────────────────────────────────────
function CircularBadge({ badge, earned, userXP, index }: { badge: typeof BADGE_DEFINITIONS[0]; earned: boolean; userXP: number; index: number }) {
  const size = (SCREEN_WIDTH - 64) / 3;
  const strokeWidth = 4;
  const ringSize = size + 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate real progress percentage toward badge unlock
  const pct = badge.xpRequired === 0 ? 100 : Math.min(100, Math.round((userXP / badge.xpRequired) * 100));
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  // Playful pop-in entrance, staggered per badge
  const pop = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 90),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
    ]).start(() => {
      if (earned) {
        Animated.sequence([
          Animated.timing(wiggle, { toValue: 1, duration: 110, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(wiggle, { toValue: -1, duration: 140, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(wiggle, { toValue: 0, duration: 110, easing: Easing.linear, useNativeDriver: true }),
        ]).start();
      }
    });
  }, []);

  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Animated.View style={[styles.badgeItemContainer, { transform: [{ scale: pop }, { rotate }] }]}>
      <View style={[
        styles.badgeCircleWrapper,
        { width: ringSize, height: ringSize },
        earned && { shadowColor: badge.glow, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
      ]}>
        <Svg width={ringSize} height={ringSize} style={StyleSheet.absoluteFill}>
          <Circle cx={ringSize / 2} cy={ringSize / 2} r={radius} stroke={earned ? "transparent" : "#E7ECF3"} strokeWidth={strokeWidth} fill="none" />
          {!earned && (
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="#B9C3D4"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.06} ${circumference * 0.05}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          )}
        </Svg>

        {earned ? (
          <LinearGradient
            colors={badge.gradient as any}
            start={{ x: 0.15, y: 0.1 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.badgeInnerCircle, { width: size, height: size, borderRadius: size / 2 }]}
          >
            <View style={styles.badgeShine} />
            <Image source={badge.image} style={styles.badgeImage} contentFit="contain" />
          </LinearGradient>
        ) : (
          <View style={[styles.badgeInnerCircle, styles.badgeInnerCircleLocked, { width: size, height: size, borderRadius: size / 2 }]}>
            <QuestionIcon size={26} color="#B9C3D4" />
          </View>
        )}

        {earned && (
          <>
            <View style={[styles.badgeCheckDot, { backgroundColor: badge.glow }]}>
              <Svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="20 6 9 17 4 12" />
              </Svg>
            </View>
            <View style={styles.badgeSparkle}>
              <SparkleIcon size={16} color="#FDE68A" />
            </View>
          </>
        )}
      </View>

      <Text style={[styles.badgeTitle, !earned && styles.badgeTitleLocked]} numberOfLines={1}>
        {badge.name}
      </Text>
      {!earned && (
        <View style={styles.badgeXpPill}>
          <Text style={styles.badgeXpText}>🔒 {badge.xpRequired} XP</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ── Main Screen Component ──────────────────────────────────────────────
export default function Achievements() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [streakDays, setStreakDays] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [latestEarnedBadgeName, setLatestEarnedBadgeName] = useState<string>('First Step');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Load Cached Local User Data
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        const student = user.student;
        setStudentName(`${student?.first_name || ''} ${student?.last_name || ''}`.trim());
      }

      // Backend API Call
      const response = await api.getStudentLessons();
      if (response.success && response.student) {
        const xp = response.student.total_xp || 0;
        setTotalXP(xp);
        setLevel(response.student.level || 1);
        setStreakDays(response.student.streak_days || 0);

        // Derive Earned Badges directly from Backend Data
        calculateEarnedBadges(xp);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnedBadges = (xp: number) => {
    const earnedList = BADGE_DEFINITIONS
      .filter(badge => xp >= badge.xpRequired);

    const earnedIds = earnedList.map(badge => badge.id);
    setEarnedBadges(earnedIds);

    if (earnedList.length > 0) {
      const latest = earnedList[earnedList.length - 1];
      setLatestEarnedBadgeName(latest.name);
    }
  };

  const isBadgeEarned = (badgeId: string) => earnedBadges.includes(badgeId);

  const totalBadges = BADGE_DEFINITIONS.length;
  const earnedCount = earnedBadges.length;

  // Dynamically calculate percentile based on earned count vs total badges
  const userPercentile = Math.min(99, Math.round((earnedCount / totalBadges) * 100));

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1E4F8A" />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Top Bar — matches dashboard ── */}
        <View style={styles.topBar}>
          <Text style={styles.logoText}>SEÑAS</Text>
          <View style={styles.topBarRight}>
            <View style={styles.statPill}>
              <StarIcon size={13} color="#F59E0B" />
              <Text style={styles.statPillText}>{totalXP} XP</Text>
            </View>
            <View style={styles.streakBadge}>
              <FlameIcon size={14} color="#fb923c" />
              <Text style={styles.streakText}>{streakDays}</Text>
            </View>
          </View>
        </View>

        {/* ── Hero Banner — same blue gradient & drifting clouds as dashboard ── */}
        <View style={styles.section}>
          <View style={styles.bannerWrapper}>
            <LinearGradient
              colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerCard}
            >
              {/* Drifting clouds, clipped to the card */}
              <DriftingCloud top={8} size={1.3} duration={20000} startX={0} opacity={0.20} variant={1} trackWidth={SCREEN_WIDTH - 32} />
              <DriftingCloud top={42} size={0.9} duration={16000} startX={SCREEN_WIDTH * 0.5} opacity={0.15} variant={3} trackWidth={SCREEN_WIDTH - 32} />

              <View style={styles.bannerLeft}>
                <View style={styles.bannerSubtitleRow}>
                  <TrophyIcon size={13} color="#fde68a" />
                  <Text style={styles.bannerSubtitle}>Your Latest Achievement</Text>
                </View>
                <Text style={styles.bannerTag}>{latestEarnedBadgeName}</Text>

                <View style={styles.actionButtonsRow}>
                  <Pressable
                    style={styles.shareBtn}
                    onPress={() => setShowConfetti(true)}
                  >
                    <Text style={styles.shareBtnText}>Share</Text>
                    <ShareIcon size={15} color="#0f3172" />
                  </Pressable>

                  <Pressable style={styles.iconOnlyBtn}>
                    <DownloadIcon size={15} color="#0f3172" />
                  </Pressable>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* ── Progress summary card ── */}
        <View style={styles.section}>
          <View style={styles.progressCard}>
            <View style={styles.progressIconBox}>
              <TrophyIcon size={24} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.openCountText}>
                {earnedCount}/{totalBadges} Achievements Unlocked
              </Text>
              <Text style={styles.subtextText}>
                You're cooler than {userPercentile}% of users!
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(earnedCount / totalBadges) * 100}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ── Badges Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f3172" strokeWidth="2">
                <Path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
                <Path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" />
              </Svg>
              <Text style={styles.sectionTitle}> All Badges</Text>
            </View>
          </View>

          <View style={styles.badgesCard}>
            <View style={styles.gridContainer}>
              {BADGE_DEFINITIONS.map((badge, index) => (
                <CircularBadge
                  key={badge.id}
                  badge={badge}
                  earned={isBadgeEarned(badge.id)}
                  userXP={totalXP}
                  index={index}
                />
              ))}
            </View>
          </View>
        </View>

      </ScrollView>

      {showConfetti && (
        <ConfettiCannon
          count={150}
          origin={{ x: -10, y: 0 }}
          autoStart={true}
          fadeOut={true}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },

  section: { paddingHorizontal: 16, marginBottom: 14 },

  // ── Top Bar — matches dashboard ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  logoText: {
    color: '#0f3172',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f3172',
  },
  streakBadge: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  streakText: { color: '#0f3172', fontSize: 13, fontWeight: '700' },

  // ── Hero Banner — same as dashboard hero card ──
  bannerWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0d326b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  bannerCard: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 150,
    overflow: 'hidden',
  },
  bannerLeft: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 2,
    paddingRight: 8,
  },
  bannerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fde68a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bannerTag: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f3172',
  },
  iconOnlyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  // ── Progress summary card ──
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  progressIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openCountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f3172',
    marginBottom: 2,
  },
  subtextText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  progressTrack: {
    backgroundColor: '#eff6ff',
    borderRadius: 99,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 99,
  },

  // ── Section header — matches dashboard ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f3172' },

  // ── Badges card + grid ──
  badgesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 70,
    rowGap: 22,
  },
  badgeItemContainer: {
    width: (SCREEN_WIDTH - 32 - 36 - 44) / 3,
    alignItems: 'center',
  },
  badgeCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  badgeInnerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeInnerCircleLocked: {
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  badgeShine: {
    position: 'absolute',
    top: -8,
    left: -6,
    width: '70%',
    height: '55%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ rotate: '-25deg' }],
  },
  badgeImage: {
    width: '68%',
    height: '68%',
  },
  badgeCheckDot: {
    position: 'absolute',
    bottom: 4,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeSparkle: {
    position: 'absolute',
    top: -2,
    left: 0,
  },
  badgeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f3172',
    textAlign: 'center',
  },
  badgeTitleLocked: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  badgeXpPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeXpText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
});