import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Icons ────────────────────────────────────────────────────────────────────
function FlameIcon({ size = 20, color = '#fb923c' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M12 2c0 6-8 8-8 14a8 8 0 0016 0C20 10 12 8 12 2z" />
        </Svg>
    );
}

function HomeIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <Path d="M9 22V12h6v10" />
        </Svg>
    );
}


// ─── Pulsing ring around the streak number ────────────────────────────────────
function PulseRing({ size, color }: { size: number; color: string }) {
    const ring1 = useRef(new Animated.Value(1)).current;
    const ring2 = useRef(new Animated.Value(1)).current;
    const op1 = useRef(new Animated.Value(0.5)).current;
    const op2 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = (scale: Animated.Value, op: Animated.Value, delay: number, baseOp: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(scale, { toValue: 1.5, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                        Animated.timing(op, { toValue: 0, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                        Animated.timing(op, { toValue: baseOp, duration: 0, useNativeDriver: true }),
                    ]),
                ])
            ).start();
        };
        pulse(ring1, op1, 0, 0.5);
        pulse(ring2, op2, 600, 0.3);
    }, []);

    return (
        <>
            <Animated.View style={{
                position: 'absolute', width: size, height: size, borderRadius: size / 2,
                borderWidth: 2, borderColor: color, opacity: op1, transform: [{ scale: ring1 }],
            }} />
            <Animated.View style={{
                position: 'absolute', width: size, height: size, borderRadius: size / 2,
                borderWidth: 1.5, borderColor: color, opacity: op2, transform: [{ scale: ring2 }],
            }} />
        </>
    );
}

export default function StreakScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<Record<string, string>>();
    const streakDays = parseInt(params.streakDays || '0');

    const handleBackToLessons = () => {
        router.replace('/(tabs)/lessons');
    };

    // ─── Sound ──────────────────────────────────────────────────────────────────
    const [sound, setSound] = React.useState<Audio.Sound | null>(null);
    useEffect(() => {
        async function playSound() {
            try {
                const { sound: s } = await Audio.Sound.createAsync(
                    require('../../assets/music/achievement.mp3'),
                    { shouldPlay: true, isLooping: false, volume: 0.8 }
                );
                setSound(s);
            } catch (e) {
                console.error('streak sound failed:', e);
            }
        }
        playSound();
        return () => { sound?.unloadAsync(); };
    }, []);

    // ─── Animations ─────────────────────────────────────────────────────────────
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleNum = useRef(new Animated.Value(0.5)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.spring(scaleNum, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

    // ─── Helpers ────────────────────────────────────────────────────────────────
    const getNextMilestone = () => {
        if (streakDays < 3) return 3;
        if (streakDays < 7) return 7;
        if (streakDays < 14) return 14;
        if (streakDays < 30) return 30;
        return null;
    };
    const nextMilestone = getNextMilestone();

    const getStreakLabel = () => {
        if (streakDays === 0) return { title: 'Start Your Streak!', sub: 'Complete a lesson every day to build your streak.', emoji: '🌱' };
        if (streakDays === 1) return { title: "Day 1 — Let's Go!", sub: 'One step at a time. Come back tomorrow!', emoji: '🔥' };
        if (streakDays < 7) return { title: `${streakDays} Days Strong!`, sub: "You're building an incredible habit.", emoji: '🔥' };
        if (streakDays < 14) return { title: `${streakDays} Day Streak!`, sub: 'A whole week of dedication — impressive!', emoji: '⚡' };
        if (streakDays < 30) return { title: `${streakDays} Days on Fire!`, sub: "You're a signing machine. Keep it up!", emoji: '🏆' };
        return { title: `${streakDays} Day Legend!`, sub: 'You are truly dedicated. Incredible!', emoji: '👑' };
    };
    const { title, sub, emoji } = getStreakLabel();

    const RING_SIZE = 148;
    const flameColor = streakDays >= 7 ? '#F59E0B' : '#fb923c';

    // ─── Weekly calendar ────────────────────────────────────────────────────────
    const getWeekDays = () => {
        const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const today = new Date();
        const dow = today.getDay();
        const diff = dow === 0 ? 6 : dow - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - diff);

        return names.map((name, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return {
                name,
                isToday: d.toDateString() === today.toDateString(),
                isFuture: d > today,
                offsetFromToday: Math.floor((today.getTime() - d.getTime()) / 86400000),
            };
        });
    };

    const weekDays = getWeekDays();
    const isDayActive = (offsetFromToday: number) => offsetFromToday >= 0 && offsetFromToday < streakDays;

    return (
        <SafeAreaView style={s.root}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0F6FF" />

            {/* Top Bar */}
            <View style={s.topBar}>
                <Pressable onPress={handleBackToLessons} style={s.closeBtn}>
                    <Text style={s.closeBtnText}>✕</Text>
                </Pressable>
                <Text style={s.logoText}>SEÑAS</Text>
                <View style={s.streakPill}>
                    <FlameIcon size={14} color="#fb923c" />
                    <Text style={s.streakPillText}>{streakDays}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                    {/* Hero gradient + big fire circle */}
                    <View style={s.heroSection}>
                        <LinearGradient
                            colors={['#0d326b', '#1848c8', '#2563EB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={s.heroGradient}
                        >
                            <View style={s.heroEyebrowRow}>
                                <View style={s.heroEyebrow}>
                                    <Text style={s.heroEyebrowText}>🔥 STREAK MILESTONE</Text>
                                </View>
                                <View style={s.heroBadge}>
                                    <Text style={s.heroBadgeText}>{emoji} Active</Text>
                                </View>
                            </View>

                            <View style={s.ringWrap}>
                                <PulseRing size={RING_SIZE} color={flameColor} />
                                <Animated.View style={[s.ringInner, { transform: [{ scale: scaleNum }, { translateY: floatY }] }]}>
                                    <View style={[s.ringCircle, { borderColor: flameColor }]}>
                                        <FlameIcon size={30} color={flameColor} />
                                        <Text style={[s.ringNumber, { color: flameColor }]}>{streakDays}</Text>
                                        <Text style={s.ringLabel}>{streakDays === 1 ? 'DAY' : 'DAYS'}</Text>
                                    </View>
                                </Animated.View>
                            </View>

                            <Text style={s.heroTitle}>{title}</Text>
                            <Text style={s.heroSub}>{sub}</Text>
                        </LinearGradient>
                    </View>

                    {/* Weekly Calendar */}
                    <View style={s.card}>
                        <Text style={s.cardLabel}>📅 THIS WEEK</Text>
                        <View style={s.calRow}>
                            {weekDays.map((day, i) => {
                                const active = isDayActive(day.offsetFromToday);
                                const isToday = day.isToday;
                                const isFuture = day.isFuture;
                                return (
                                    <View key={i} style={s.calDay}>
                                        <View style={[
                                            s.calCircle,
                                            active && s.calCircleActive,
                                            isToday && !active && s.calCircleToday,
                                            isFuture && s.calCircleFuture,
                                        ]}>
                                            {active
                                                ? <Ionicons name="checkmark" size={15} color="#fff" />
                                                : isToday
                                                    ? <View style={s.todayDot} />
                                                    : null}
                                        </View>
                                        <Text style={[
                                            s.calDayName,
                                            active && s.calDayNameActive,
                                            isToday && s.calDayNameToday,
                                            isFuture && s.calDayNameFuture,
                                        ]}>{day.name}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Milestone Progress */}
                    {nextMilestone && (
                        <View style={s.card}>
                            <View style={s.milestoneTop}>
                                <Text style={s.cardLabel}>🎯 NEXT GOAL</Text>
                                <Text style={s.milestonePct}>{streakDays}/{nextMilestone} days</Text>
                            </View>
                            <View style={s.milestoneTrack}>
                                <View style={[
                                    s.milestoneFill,
                                    { width: `${Math.min((streakDays / nextMilestone) * 100, 100)}%` as any }
                                ]} />
                            </View>
                            <Text style={s.milestoneHint}>
                                {nextMilestone - streakDays > 0
                                    ? `🔥 ${nextMilestone - streakDays} more day${nextMilestone - streakDays === 1 ? '' : 's'} to the ${nextMilestone}-day badge!`
                                    : '🏆 You hit the milestone!'}
                            </Text>
                        </View>
                    )}

                    {/* CTA Button */}
                    <View style={s.ctaSection}>
                        <Pressable style={s.ctaBtnPrimary} onPress={handleBackToLessons}>
                            <HomeIcon size={16} color="#fff" />
                            <Text style={s.ctaBtnText}>Back to Lessons</Text>
                        </Pressable>
                    </View>

                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F0F6FF' },
    scroll: { paddingBottom: 48 },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10,
    },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: '#E2E8F0',
    },
    closeBtnText: { fontSize: 14, fontWeight: '800', color: '#0f3172' },
    logoText: { color: '#0f3172', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
    streakPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#FFF7ED', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12,
        borderWidth: 1.5, borderColor: '#FDBA74',
    },
    streakPillText: { fontSize: 13, fontWeight: '900', color: '#C2410C' },

    heroSection: {
        marginHorizontal: 16, marginBottom: 16,
        borderRadius: 28, overflow: 'hidden',
        shadowColor: '#0d326b', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28, shadowRadius: 20, elevation: 8,
    },
    heroGradient: { padding: 24, alignItems: 'center', paddingBottom: 32 },
    heroEyebrowRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', width: '100%', marginBottom: 20,
    },
    heroEyebrow: {
        backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99,
        paddingVertical: 5, paddingHorizontal: 12,
    },
    heroEyebrowText: { fontSize: 10.5, fontWeight: '900', color: '#FDE68A', letterSpacing: 0.5 },
    heroBadge: {
        backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 99,
        paddingVertical: 5, paddingHorizontal: 12,
    },
    heroBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

    ringWrap: {
        width: 148, height: 148,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    ringInner: { alignItems: 'center', justifyContent: 'center' },
    ringCircle: {
        width: 128, height: 128, borderRadius: 64,
        backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 3,
        alignItems: 'center', justifyContent: 'center',
    },
    ringNumber: { fontSize: 44, fontWeight: '900', lineHeight: 48 },
    ringLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginTop: -2 },

    heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 6 },
    heroSub: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.78)', textAlign: 'center', lineHeight: 19 },

    card: {
        marginHorizontal: 16, marginBottom: 14,
        backgroundColor: '#fff', borderRadius: 22, padding: 18,
        borderWidth: 1.5, borderColor: '#E2E8F0',
        shadowColor: '#0f3172', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    },
    cardLabel: { fontSize: 11, fontWeight: '900', color: '#0f3172', letterSpacing: 0.8, marginBottom: 14 },

    calRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    calDay: { alignItems: 'center', gap: 6 },
    calCircle: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
    },
    calCircleActive: { backgroundColor: '#10B981' },
    calCircleToday: { backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#2563EB' },
    calCircleFuture: { backgroundColor: '#F1F5F9' },
    todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
    calDayName: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    calDayNameActive: { color: '#10B981' },
    calDayNameToday: { color: '#2563EB' },
    calDayNameFuture: { color: '#CBD5E1', fontWeight: '500' },

    milestoneTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    milestonePct: { fontSize: 13, fontWeight: '800', color: '#2563EB' },
    milestoneTrack: { height: 10, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
    milestoneFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 6 },
    milestoneHint: { fontSize: 12, fontWeight: '600', color: '#64748B', lineHeight: 18 },

    ctaSection: { marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
    ctaBtnPrimary: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', backgroundColor: '#1848c8', borderRadius: 60, paddingVertical: 16,
        shadowColor: '#1848c8', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    },
    ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
