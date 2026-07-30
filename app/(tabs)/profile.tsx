import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { api } from '../../services/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Cloud shape variants — same motif used across splash/login/dashboard ──
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

// ── SVG Icons ──────────────────────────────────────────────────────────
function BellIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function SoundIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function HapticIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="5" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.9" />
    </Svg>
  );
}
function TextSizeIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7V4h16v3M9 20h6M12 4v16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function LanguageIcon({ size = 20, color = "#4b7bbb" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M3 12h18M12 3a15 15 0 0 0 0 18 15 15 0 0 0 0-18z" stroke={color} strokeWidth="2" />
    </Svg>
  );
}
function HelpIcon({ size = 20, color = "#4b7bbb" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}
function InfoIcon({ size = 20, color = "#4b7bbb" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function ChevronIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function SignOutIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="16 17 21 12 16 7" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="21" y1="12" x2="9" y2="12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function FlameIcon({ size = 14, color = "#fb923c" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2c0 6-8 8-8 14a8 8 0 0016 0C20 10 12 8 12 2z" />
    </Svg>
  );
}
function EnergyIcon({ size = 14, color = "#F59E0B" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </Svg>
  );
}
function SparkleIcon({ size = 14, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </Svg>
  );
}
function LockDot({ size = 9, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="11" width="16" height="9" rx="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}
function MapPathIcon({ size = 20, color = "#2563EB" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 18l6-4 6 4 6-4" />
      <Circle cx="3" cy="18" r="1.5" fill={color} />
      <Circle cx="9" cy="14" r="1.5" fill={color} />
      <Circle cx="15" cy="18" r="1.5" fill={color} />
      <Circle cx="21" cy="14" r="1.5" fill={color} />
    </Svg>
  );
}
function ChartIcon({ size = 20, color = "#0f3172" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 3v18h18" />
      <Path d="M7 15l4-4 3 3 5-6" />
    </Svg>
  );
}
function MedalIcon({ size = 20, color = "#0f3172" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="15" r="5" />
      <Path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" />
    </Svg>
  );
}
function TuneIcon({ size = 20, color = "#0f3172" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="4" y1="6" x2="20" y2="6" />
      <Line x1="4" y1="12" x2="20" y2="12" />
      <Line x1="4" y1="18" x2="20" y2="18" />
      <Circle cx="9" cy="6" r="2" fill={color} />
      <Circle cx="16" cy="12" r="2" fill={color} />
      <Circle cx="7" cy="18" r="2" fill={color} />
    </Svg>
  );
}

// ── Helper Functions ──────────────────────────────────────────────────
function formatLearningGoal(goal: string) {
  if (!goal) return 'Not set';
  return goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatPracticeTime(time: string) {
  if (!time) return 'Not set';
  return time.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Same medal-gradient palette used on the Achievements screen, so badges feel
// like one continuous system across the app.
const BADGE_COLOR_MAP: Record<string, [string, string]> = {
  'First Step': ['#7DD3FC', '#38BDF8'],
  'Alphabet Star': ['#FDE68A', '#FBBF24'],
  'Streak Starter': ['#FCA5A5', '#F87171'],
  'Greeter': ['#67E8F9', '#22D3EE'],
  'Quiz Whiz': ['#D8B4FE', '#C084FC'],
  'Sign Detective': ['#A5B4FC', '#818CF8'],
  'Number Ninja': ['#FDBA74', '#FB923C'],
  'Week Warrior': ['#F9A8D4', '#F472B6'],
};

// ── Small reusable section header ───────────────────────────────────────
function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ── Mini medal badge (matches Achievements page badge system) ──────────
function MiniMedal({ label, src, locked, index }: { label: string; src: any; locked: boolean; index: number }) {
  const pop = useRef(new Animated.Value(0)).current;
  const colors = BADGE_COLOR_MAP[label] || ['#CBD5E1', '#94A3B8'];

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 90),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.miniMedalItem, { transform: [{ scale: pop }] }]}>
      {locked ? (
        <View style={styles.miniMedalLocked}>
          <LockDot size={16} color="#B9C3D4" />
        </View>
      ) : (
        <LinearGradient
          colors={colors}
          start={{ x: 0.15, y: 0.1 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.miniMedalEarned}
        >
          <View style={styles.miniMedalShine} />
          <Image source={src} style={styles.miniMedalImg} contentFit="contain" />
          <View style={styles.miniMedalSparkle}>
            <SparkleIcon size={12} color="#FDE68A" />
          </View>
        </LinearGradient>
      )}
      <Text style={[styles.miniMedalLabel, locked && styles.miniMedalLabelLocked]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

// ── Sign Out Modal ──────────────────────────────────────────────────────
function SignOutModal({ visible, onClose, onConfirm }: {
  visible: boolean; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.signOutModal} onPress={e => e.stopPropagation()}>
          <View style={styles.signOutIconBox}>
            <SignOutIcon />
          </View>
          <Text style={styles.signOutTitle}>Heading out?</Text>
          <Text style={styles.signOutDesc}>
            You'll need to sign in again to keep your streak going!
          </Text>
          <View style={styles.signOutBtns}>
            <Pressable style={styles.stayBtn} onPress={onClose}>
              <Text style={styles.stayBtnText}>Stay & Learn</Text>
            </Pressable>
            <Pressable style={styles.confirmSignOutBtn} onPress={onConfirm}>
              <Text style={styles.confirmSignOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Edit Profile Modal ──────────────────────────────────────────────────
function EditProfileModal({ visible, onClose, userName, onSave }: {
  visible: boolean; onClose: () => void; userName: string; onSave: (name: string) => void;
}) {
  const [name, setName] = useState(userName);
  const [showBadges, setShowBadges] = useState(true);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.editModal} onPress={e => e.stopPropagation()}>
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>Edit Profile</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.avatarEditCenter}>
            <View style={styles.avatarEditRing}>
              <Image
                source={require('../../assets/images/img/senya_blue.png')}
                style={styles.avatarEditImg}
                contentFit="cover"
              />
            </View>
            <Pressable style={styles.changePicBtn}>
              <Text style={styles.changePicText}>Change Picture</Text>
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter a nickname"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.fieldNote}>*Your real name cannot be changed</Text>
          </View>

          <View style={styles.badgeToggleRow}>
            <View>
              <Text style={styles.badgeToggleLabel}>Show Badges</Text>
              <Text style={styles.badgeToggleSub}>Display your earned badges on profile</Text>
            </View>
            <Switch
              value={showBadges}
              onValueChange={setShowBadges}
              trackColor={{ false: '#ddd', true: '#2563EB' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.editModalBtns}>
            <Pressable style={styles.cancelEditBtn} onPress={onClose}>
              <Text style={styles.cancelEditText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={() => { onSave(name); onClose(); }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Profile Screen ─────────────────────────────────────────────────
export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Student');
  const [studentLevel, setStudentLevel] = useState('Beginner');
  const [learningGoal, setLearningGoal] = useState('Not set');
  const [practiceTime, setPracticeTime] = useState('Not set');
  const [memberSince, setMemberSince] = useState('2026');
  const [totalXp, setTotalXp] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);
  const [progressData, setProgressData] = useState<{ name: string, pct: number, color: string }[]>([]);
  const [recentBadges, setRecentBadges] = useState<{ src: any, label: string, locked: boolean }[]>([]);

  // Settings state
  const [notifs, setNotifs] = useState(true);
  const [sound, setSound] = useState(true);
  const [haptic, setHaptic] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const settingsItems = [
    { label: 'Daily Reminders', sub: 'Get notified to practice', val: notifs, set: setNotifs, Icon: BellIcon, color: '#F59E0B' },
    { label: 'Sound Effects', sub: 'Play sounds during lessons', val: sound, set: setSound, Icon: SoundIcon, color: '#8B5CF6' },
    { label: 'Haptic Feedback', sub: 'Vibrate on interactions', val: haptic, set: setHaptic, Icon: HapticIcon, color: '#10B981' },
    { label: 'Large Text Mode', sub: 'Bigger text for readability', val: largeText, set: setLargeText, Icon: TextSizeIcon, color: '#2563EB' },
  ];

  const accountItems = [
    { label: 'Language Preference', Icon: LanguageIcon },
    { label: 'Help & Support', Icon: HelpIcon },
    { label: 'About SEÑAS', Icon: InfoIcon },
  ];

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        const student = user.student;
        const fullName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
        setUserName(fullName || 'Student');
        setStudentLevel(student?.fsl_mastery_level || 'Beginner');
      }

      const response = await api.getStudentLessons();
      if (response.success) {
        const student = response.student;
        setTotalXp(student?.total_xp || 0);
        setStreakDays(student?.streak_days || 0);

        if (student?.fsl_mastery_level) {
          setStudentLevel(student.fsl_mastery_level);
        }

        const completedLessons = response.lessons?.filter((l: any) => l.status === 'completed') || [];
        setTotalLessons(completedLessons.length);

        const earnedBadgesCount = Math.min(Math.floor((student?.total_xp || 0) / 50) + 1, 8);
        setTotalBadges(earnedBadgesCount > 0 ? Math.min(earnedBadgesCount, 8) : 0);

        const progressItems = response.lessons?.slice(0, 4).map((lesson: any, index: number) => {
          const progress = lesson.progress;
          const pct = progress ? Math.round((progress.current_step / lesson.total_steps) * 100) : 0;
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
          return {
            name: lesson.title,
            pct: pct,
            color: colors[index % colors.length]
          };
        }) || [];

        while (progressItems.length < 4) {
          const placeholders = ['FSL Alphabet', 'Greetings', 'Numbers', 'Classroom Words'];
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
          progressItems.push({
            name: placeholders[progressItems.length],
            pct: 0,
            color: colors[progressItems.length]
          });
        }
        setProgressData(progressItems);

        const badgeData = [
          { xp: 0, label: 'First Step', src: require('../../assets/images/img/first_step.png') },
          { xp: 50, label: 'Alphabet Star', src: require('../../assets/images/img/alphabet_star.png') },
          { xp: 100, label: 'Streak Starter', src: require('../../assets/images/img/streak1.png') },
          { xp: 150, label: 'Greeter', src: require('../../assets/images/img/greetings.png') },
        ];

        const earnedBadgeList = badgeData
          .filter(b => (student?.total_xp || 0) >= b.xp)
          .slice(0, 4)
          .map(b => ({ src: b.src, label: b.label, locked: false }));

        const placeholderBadges: { label: string }[] = [
          { label: 'Quiz Whiz' },
          { label: 'Sign Detective' },
          { label: 'Number Ninja' },
          { label: 'Week Warrior' },
        ];

        const combined = [...earnedBadgeList];
        let p = 0;
        while (combined.length < 4) {
          combined.push({ src: null, label: placeholderBadges[p].label, locked: true });
          p++;
        }
        setRecentBadges(combined);
      }

      try {
        const pathResponse = await api.getLearningPath();
        if (pathResponse && pathResponse.learning_path) {
          const path = pathResponse.learning_path;
          setLearningGoal(formatLearningGoal(path.learning_goal));
          setPracticeTime(formatPracticeTime(path.practice_time));
        }
      } catch (error) {
        console.log('No learning path found');
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Lessons Done', value: totalLessons.toString(), icon: require('../../assets/images/img/lesson.png'), color: '#3B82F6' },
    { label: 'Total XP', value: totalXp.toString(), icon: require('../../assets/images/img/energy.png'), color: '#F59E0B' },
    { label: 'Day Streak', value: streakDays.toString(), icon: require('../../assets/images/img/streak.png'), color: '#EF4444' },
    { label: 'Badges', value: totalBadges.toString(), icon: require('../../assets/images/img/badges.png'), color: '#8B5CF6' },
  ];

  // Decorative XP ring around the avatar (progress toward the next 100 XP milestone)
  const ringPct = Math.min(100, totalXp % 100 === 0 && totalXp > 0 ? 100 : totalXp % 100);
  const ringSize = 108;
  const ringStroke = 6;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashoffset = ringCircumference - (ringPct / 100) * ringCircumference;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1E4F8A" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        userName={userName}
        onSave={setUserName}
      />
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={async () => {
          setShowSignOutModal(false);
          await AsyncStorage.removeItem('userData');
          router.replace('/');
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Top Bar — matches dashboard / achievements ── */}
        <View style={styles.topBar}>
          <Text style={styles.logoText}>SEÑAS</Text>
          <View style={styles.topBarRight}>
            <View style={styles.statPill}>
              <EnergyIcon size={13} color="#F59E0B" />
              <Text style={styles.statPillText}>{totalXp} XP</Text>
            </View>
            <View style={styles.streakBadge}>
              <FlameIcon size={14} color="#fb923c" />
              <Text style={styles.streakText}>{streakDays}</Text>
            </View>
          </View>
        </View>

        {/* ── ID Card — playful sticker-style card, no gradient hero ── */}
        <View style={styles.section}>
          <View style={styles.idCardWrapper}>
            <LinearGradient
              colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.idCard}
            >
              <DriftingCloud top={12} size={1.3} duration={20000} startX={0} opacity={0.18} variant={2} trackWidth={SCREEN_W - 32} />
              <DriftingCloud top={54} size={0.9} duration={16000} startX={SCREEN_W * 0.45} opacity={0.14} variant={0} trackWidth={SCREEN_W - 32} />

              <Pressable style={styles.idEditBtn} onPress={() => setShowEditModal(true)}>
                <Text style={styles.idEditIcon}>✎</Text>
              </Pressable>

              <View style={styles.avatarRingWrap}>
                <Svg width={ringSize} height={ringSize} style={StyleSheet.absoluteFill}>
                  <Circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} stroke="rgba(255,255,255,0.22)" strokeWidth={ringStroke} fill="none" />
                  <Circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    stroke="#FBBF24"
                    strokeWidth={ringStroke}
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                  />
                </Svg>
                <View style={styles.avatarInnerCircle}>
                  <Image
                    source={require('../../assets/images/img/senya_blue.png')}
                    style={styles.avatarImg}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.crownBadge}>
                  <SparkleIcon size={13} color="#0f3172" />
                </View>
              </View>

              <Text style={styles.idName}>{userName}</Text>

              <View style={styles.idTagRow}>
                <View style={styles.idTagGold}>
                  <Text style={styles.idTagGoldText}>{studentLevel}</Text>
                </View>
                <View style={styles.idTagMuted}>
                  <MedalIcon size={11} color="#fff" />
                  <Text style={styles.idTagMutedText}>{totalBadges}/8 badges</Text>
                </View>
              </View>

              <Text style={styles.idMemberSince}>Learning FSL since {memberSince}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ── Stats — 2x2 bento grid, not a single row ── */}
        <View style={styles.section}>
          <View style={styles.bentoGrid}>
            {stats.map((s, i) => (
              <View key={i} style={[styles.bentoTile, { backgroundColor: `${s.color}12`, borderColor: `${s.color}30` }]}>
                <View style={[styles.bentoIconBox, { backgroundColor: `${s.color}22` }]}>
                  <Image source={s.icon} style={styles.bentoIcon} contentFit="contain" />
                </View>
                <Text style={[styles.bentoValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.bentoLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Your Journey — path-style row instead of plain list rows ── */}
        <View style={styles.section}>
          <SectionHeader title="Your Journey" icon={<MapPathIcon size={19} color="#0f3172" />} />
          <View style={styles.journeyRow}>
            <View style={styles.journeyNode}>
              <View style={[styles.journeyIconBox, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </Svg>
              </View>
              <Text style={styles.journeyLabel}>Level</Text>
              <Text style={styles.journeyValue} numberOfLines={1}>{studentLevel}</Text>
            </View>

            <View style={styles.journeyConnector}>
              <View style={styles.journeyDot} />
              <View style={styles.journeyDot} />
              <View style={styles.journeyDot} />
            </View>

            <View style={styles.journeyNode}>
              <View style={[styles.journeyIconBox, { backgroundColor: 'rgba(16,185,129,0.10)' }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                  <Path d="M12 6V2l4 4-4 4V8c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6h2c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8z" />
                </Svg>
              </View>
              <Text style={styles.journeyLabel}>Goal</Text>
              <Text style={styles.journeyValue} numberOfLines={1}>{learningGoal}</Text>
            </View>

            <View style={styles.journeyConnector}>
              <View style={styles.journeyDot} />
              <View style={styles.journeyDot} />
              <View style={styles.journeyDot} />
            </View>

            <View style={styles.journeyNode}>
              <View style={[styles.journeyIconBox, { backgroundColor: 'rgba(251,191,36,0.14)' }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <Circle cx="12" cy="12" r="10" />
                  <Polyline points="12 6 12 12 16 14" />
                </Svg>
              </View>
              <Text style={styles.journeyLabel}>Practice</Text>
              <Text style={styles.journeyValue} numberOfLines={1}>{practiceTime}</Text>
            </View>
          </View>
        </View>

        {/* ── Learning Progress — individual shelf cards, not one divided list ── */}
        <View style={styles.section}>
          <SectionHeader title="Learning Progress" icon={<ChartIcon size={19} color="#0f3172" />} />
          <View style={{ gap: 10 }}>
            {progressData.map((item, i) => (
              <View key={i} style={styles.progressShelfCard}>
                <View style={[styles.progressShelfDot, { backgroundColor: item.color }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressName} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.progressPct, { color: item.color }]}>{item.pct}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${item.pct}%` as any, backgroundColor: item.color }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Recent Badges — mini gradient medals, same system as Achievements ── */}
        <View style={styles.section}>
          <SectionHeader title="Recent Badges" icon={<MedalIcon size={19} color="#0f3172" />} />
          <View style={styles.miniBadgesCard}>
            <View style={styles.miniBadgesRow}>
              {recentBadges.map((b, i) => (
                <MiniMedal key={i} label={b.label} src={b.src} locked={b.locked} index={i} />
              ))}
            </View>
          </View>
        </View>

        {/* ── Preferences — colorful icon chips instead of uniform grey ── */}
        <View style={styles.section}>
          <SectionHeader title="Preferences" icon={<TuneIcon size={19} color="#0f3172" />} />
          <View style={styles.settingsCard}>
            {settingsItems.map(({ label, sub, val, set, Icon, color }, i) => (
              <View key={i} style={[styles.settingRow, i < settingsItems.length - 1 && styles.settingBorder]}>
                <View style={[styles.settingIconBox, { backgroundColor: color }]}>
                  <Icon size={18} color="#fff" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{label}</Text>
                  <Text style={styles.settingSub}>{sub}</Text>
                </View>
                <Switch
                  value={val}
                  onValueChange={set}
                  trackColor={{ false: 'rgba(15,49,114,0.15)', true: '#2563EB' }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            {accountItems.map(({ label, Icon }, i) => (
              <Pressable key={i} style={[styles.accountRow, i < accountItems.length - 1 && styles.settingBorder]}>
                <View style={[styles.settingIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Icon size={18} color="#2563EB" />
                </View>
                <Text style={styles.accountLabel}>{label}</Text>
                <ChevronIcon />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Sign Out ── */}
        <View style={[styles.section, { marginTop: 4 }]}>
          <Pressable style={styles.signOutBtn} onPress={() => setShowSignOutModal(true)}>
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, color: '#666' },

  // ── Top Bar — matches dashboard / achievements ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  logoText: { color: '#0f3172', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  statPillText: { fontSize: 12, fontWeight: '700', color: '#0f3172' },
  streakBadge: {
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  streakText: { color: '#0f3172', fontSize: 13, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginTop: 16 },

  // ── ID Card — navy gradient hero with drifting clouds, dashboard palette ──
  idCardWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#0d326b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  idCard: {
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  idEditBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
    zIndex: 5,
  },
  idEditIcon: { fontSize: 14, color: '#fff' },
  avatarRingWrap: {
    width: 108, height: 108,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInnerCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#1e4b8f',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  crownBadge: {
    position: 'absolute', top: 0, right: 6,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FBBF24',
    borderWidth: 2, borderColor: '#1e4b8f',
    alignItems: 'center', justifyContent: 'center',
  },
  idName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  idTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  idTagGold: { backgroundColor: '#FBBF24', borderRadius: 99, paddingVertical: 5, paddingHorizontal: 14 },
  idTagGoldText: { color: '#78350f', fontSize: 12, fontWeight: '800' },
  idTagMuted: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 99, paddingVertical: 5, paddingHorizontal: 12 },
  idTagMutedText: { fontSize: 11.5, fontWeight: '700', color: '#fff' },
  idMemberSince: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },

  // ── Stats bento grid ──
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bentoTile: {
    width: '47.5%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
  },
  bentoIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  bentoIcon: { width: 22, height: 22 },
  bentoValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  bentoLabel: { fontSize: 11.5, fontWeight: '700', color: '#64748B' },

  // ── Section header ──
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f3172' },

  // ── Journey path row ──
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
    paddingVertical: 16,
    paddingHorizontal: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  journeyNode: { flex: 1, alignItems: 'center' },
  journeyIconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  journeyLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  journeyValue: { fontSize: 12, fontWeight: '800', color: '#0f3172', marginTop: 2, textAlign: 'center' },
  journeyConnector: { alignItems: 'center', justifyContent: 'center', gap: 3, marginHorizontal: 2 },
  journeyDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1' },

  // ── Progress shelf cards ──
  progressShelfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  progressShelfDot: { width: 10, height: 10, borderRadius: 5 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  progressName: { fontSize: 13, fontWeight: '700', color: '#1F2937', flex: 1 },
  progressPct: { fontSize: 12, fontWeight: '800' },
  progressTrack: { backgroundColor: 'rgba(15,49,114,0.08)', borderRadius: 99, height: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },

  // ── Mini badge medals ──
  miniBadgesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  miniBadgesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  miniMedalItem: { alignItems: 'center', gap: 6, width: 66 },
  miniMedalEarned: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  miniMedalShine: {
    position: 'absolute', top: -6, left: -4, width: '65%', height: '55%',
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.35)', transform: [{ rotate: '-25deg' }],
  },
  miniMedalImg: { width: '62%', height: '62%' },
  miniMedalSparkle: { position: 'absolute', top: -1, right: 2 },
  miniMedalLocked: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F1F5F9',
    borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  miniMedalLabel: { fontSize: 10, fontWeight: '700', color: '#0f3172', textAlign: 'center' },
  miniMedalLabelLocked: { color: '#94A3B8' },

  // ── Settings ──
  settingsCard: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#EAECF0',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 18 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(15,49,114,0.06)' },
  settingIconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  settingSub: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginTop: 2 },

  // ── Account ──
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 18 },
  accountLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' },

  // ── Sign out ──
  signOutBtn: {
    paddingVertical: 14, borderRadius: 60,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)',
    alignItems: 'center',
  },
  signOutBtnText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },

  // ── Modal overlay ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },

  // ── Sign Out Modal ──
  signOutModal: {
    width: '88%', maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 28, padding: 28,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.18, shadowRadius: 48, elevation: 24,
  },
  signOutIconBox: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  signOutTitle: { fontSize: 20, fontWeight: '800', color: '#0f3172', marginBottom: 8 },
  signOutDesc: { fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 20, marginBottom: 24, textAlign: 'center' },
  signOutBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  stayBtn: {
    flex: 1, paddingVertical: 13,
    backgroundColor: 'rgba(15,49,114,0.06)',
    borderWidth: 1, borderColor: 'rgba(15,49,114,0.10)',
    borderRadius: 40, alignItems: 'center',
  },
  stayBtnText: { fontSize: 13.5, fontWeight: '700', color: '#0f3172' },
  confirmSignOutBtn: {
    flex: 1, paddingVertical: 13,
    backgroundColor: '#DC2626', borderRadius: 40, alignItems: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  confirmSignOutText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Edit Modal ──
  editModal: {
    width: '90%', maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 32, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 24,
  },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  editModalTitle: { fontSize: 20, fontWeight: '800', color: '#0f3172' },
  closeBtn: { width: 32, height: 32, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 16, color: '#6B7280' },
  avatarEditCenter: { alignItems: 'center', marginBottom: 24, gap: 12 },
  avatarEditRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: 'rgba(37,99,235,0.2)',
    overflow: 'hidden', backgroundColor: '#2563EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  avatarEditImg: { width: '100%', height: '100%' },
  changePicBtn: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
    borderRadius: 40, paddingVertical: 8, paddingHorizontal: 16,
  },
  changePicText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  fieldBlock: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 16, fontSize: 14,
    backgroundColor: '#fff', color: '#1F2937',
  },
  fieldNote: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  badgeToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 24,
  },
  badgeToggleLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  badgeToggleSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  editModalBtns: { flexDirection: 'row', gap: 12 },
  cancelEditBtn: {
    flex: 1, paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 40, alignItems: 'center',
  },
  cancelEditText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  saveBtn: {
    flex: 1.5, paddingVertical: 12,
    backgroundColor: '#2563EB', borderRadius: 40, alignItems: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});