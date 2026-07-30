import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    DimensionValue,
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

// ─── SVG Icons matching main UI ───────────────────────────────────────────────
function FlameIcon({ size = 18, color = '#fb923c' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M12 2c0 6-8 8-8 14a8 8 0 0016 0C20 10 12 8 12 2z" />
        </Svg>
    );
}

function SparkleIcon({ size = 14, color = '#FDE68A' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
        </Svg>
    );
}

// ─── Cloud Animations matching main UI ────────────────────────────────────────
function CloudPuffs({ cw, ch, variant }: { cw: number; ch: number; variant: number }) {
    const w = '#ffffff';
    switch (variant % 3) {
        case 0:
            return (
                <>
                    <View style={{ position: 'absolute', bottom: 0, left: cw * 0.08, width: cw * 0.5, height: ch * 0.72, borderRadius: 999, backgroundColor: w }} />
                    <View style={{ position: 'absolute', bottom: 0, left: cw * 0.35, width: cw * 0.6, height: ch * 0.88, borderRadius: 999, backgroundColor: w }} />
                    <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw, height: ch * 0.52, borderRadius: 999, backgroundColor: w }} />
                </>
            );
        case 1:
            return (
                <>
                    <View style={{ position: 'absolute', bottom: 0, left: cw * 0.2, width: cw * 0.6, height: ch * 1.0, borderRadius: 999, backgroundColor: w }} />
                    <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw * 0.5, height: ch * 0.6, borderRadius: 999, backgroundColor: w }} />
                    <View style={{ position: 'absolute', bottom: 0, left: cw * 0.52, width: cw * 0.48, height: ch * 0.55, borderRadius: 999, backgroundColor: w }} />
                </>
            );
        default:
            return (
                <>
                    <View style={{ position: 'absolute', bottom: 0, left: cw * 0.04, width: cw * 0.4, height: ch * 0.95, borderRadius: 999, backgroundColor: w }} />
                    <View style={{ position: 'absolute', bottom: 0, left: cw * 0.48, width: cw * 0.46, height: ch * 0.8, borderRadius: 999, backgroundColor: w }} />
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
            easing: (t) => t,
            useNativeDriver: true,
        }).start(() => {
            translateX.setValue(-trackWidth * 0.5);
            Animated.loop(
                Animated.timing(translateX, {
                    toValue: trackWidth + trackWidth * 0.5,
                    duration,
                    easing: (t) => t,
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

// ─── Types & Confetti Config ───────────────────────────────────────────────
interface ConfettiConfig {
    color: string;
    top?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
    right?: DimensionValue;
    size: number;
    rotate: string;
}

const CONFETTI_PIECES: ConfettiConfig[] = [
    { color: '#2563EB', top: '8%', left: '8%', size: 10, rotate: '15deg' },
    { color: '#60A5FA', top: '6%', right: '10%', size: 12, rotate: '-25deg' },
    { color: '#10B981', top: '20%', left: '16%', size: 8, rotate: '45deg' },
    { color: '#FDE68A', top: '18%', right: '22%', size: 11, rotate: '10deg' },
    { color: '#F59E0B', top: '35%', left: '5%', size: 9, rotate: '-15deg' },
    { color: '#2563EB', top: '32%', right: '5%', size: 10, rotate: '30deg' },
];

export default function XPProgressScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<Record<string, string>>();

    const xpEarned = parseInt(params.xpEarned || '0');
    const totalXp = parseInt(params.totalXp || '0');
    const level = parseInt(params.level || '1');
    const levelName = params.levelName || 'Novice Signer';
    const previousXp = parseInt(params.previousXp || '0');
    const nextLevelXp = parseInt(params.nextLevelXp || '100');
    const streakDays = parseInt(params.streakDays || '0');
    const lessonId = params.lessonId || '';

    // Calculations
    const progress = Math.min((totalXp / nextLevelXp) * 100, 100);
    const xpNeeded = Math.max(nextLevelXp - totalXp, 0);
    const rawXpGained = totalXp - previousXp;
    const displayXpGained = xpEarned > 0 ? xpEarned : Math.max(0, rawXpGained);
    const targetProgress = progress / 100;

    // ─── Sound Effect ──────────────────────────────────────────────────────────
    const [sound, setSound] = React.useState<Audio.Sound | null>(null);

    useEffect(() => {
        async function playSound() {
            try {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    require('../../assets/music/level-up.mp3'),
                    { shouldPlay: true, isLooping: false, volume: 0.8 }
                );
                setSound(newSound);
            } catch (error) {
                console.error('Failed to play sound:', error);
            }
        }
        playSound();

        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    // ─── Animations ────────────────────────────────────────────────────────────
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const xpTextAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        progressAnim.setValue(0);

        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
            Animated.timing(progressAnim, {
                toValue: targetProgress,
                duration: 1200,
                useNativeDriver: false,
            }).start();
        }, 300);

        if (displayXpGained > 0) {
            setTimeout(() => {
                Animated.spring(xpTextAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }).start();
            }, 500);
        }

        // Floating Icon Loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleGoNext = () => {
        const showStreak = params.showStreak === 'true';

        if (showStreak) {
            router.replace({
                pathname: '/lesson/streak',
                params: {
                    streakDays: String(streakDays),
                    xpEarned: String(xpEarned),
                    totalXp: String(totalXp),
                    level: String(level),
                    levelName: levelName,
                    lessonId: lessonId,
                },
            });
        } else {
            router.replace('/(tabs)/lessons');
        }
    };

    const floatTranslate = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10],
    });

    const renderXPBadge = () => {
        if (displayXpGained <= 0) return null;

        return (
            <Animated.View
                style={[
                    styles.xpGainBadge,
                    {
                        transform: [
                            {
                                scale: xpTextAnim.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [0.3, 1.2, 1],
                                }),
                            },
                        ],
                        opacity: xpTextAnim,
                    },
                ]}
            >
                <Ionicons name="flash" size={16} color="#FFFFFF" />
                <Text style={styles.xpGainText}>+{displayXpGained} XP</Text>
            </Animated.View>
        );
    };

    const renderProgressBar = () => {
        const width = progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
        });

        const isComplete = progress >= 100;

        return (
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTrack}>
                    <Animated.View style={[styles.progressBarFillContainer, { width }]}>
                        <LinearGradient
                            colors={isComplete ? ['#10B981', '#34D399'] : ['#2563EB', '#60A5FA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.progressBarFillGradient}
                        />
                    </Animated.View>
                </View>

                <View style={styles.progressLabels}>
                    <Text style={styles.progressLabelText}>{Math.round(progress)}% Complete</Text>
                    <Text style={styles.progressLabelText}>
                        {xpNeeded > 0 ? `${xpNeeded} XP to next level` : '🏆 Level Up!'}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* ── Top Bar Header ── */}
            <View style={styles.topBar}>
                <Pressable onPress={handleGoNext} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>✕</Text>
                </Pressable>
                <Text style={styles.logoText}>SEÑAS</Text>
                <View style={styles.topBarRight}>
                    <View style={styles.streakBadgeHeader}>
                        <FlameIcon size={14} color="#fb923c" />
                        <Text style={styles.streakTextHeader}>{streakDays}</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Floating Confetti Elements */}
                {CONFETTI_PIECES.map((piece, i) => (
                    <View
                        key={`confetti-${i}`}
                        style={[
                            styles.confetti,
                            {
                                backgroundColor: piece.color,
                                top: piece.top,
                                bottom: piece.bottom,
                                left: piece.left,
                                right: piece.right,
                                width: piece.size,
                                height: piece.size,
                                transform: [{ rotate: piece.rotate }],
                            },
                        ]}
                    />
                ))}

                <Animated.View style={[styles.mainWrapper, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>

                    {/* ── Hero Banner ── */}
                    <View style={styles.section}>
                        <View style={styles.bannerWrapper}>
                            <LinearGradient
                                colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.bannerCard}
                            >
                                <DriftingCloud top={6} size={1.2} duration={20000} startX={0} opacity={0.25} variant={1} trackWidth={SCREEN_WIDTH - 32} />

                                <View style={styles.bannerContent}>
                                    <View style={styles.bannerHeader}>
                                        <Text style={styles.bannerSubtitle}>LESSON COMPLETED</Text>
                                        <View style={styles.pillCount}>
                                            <SparkleIcon size={12} color="#FDE68A" />
                                            <Text style={styles.pillCountText}>Level {level}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.bannerTitle}>
                                        {progress >= 100 ? 'Level Up!' : 'Great Progress!'}
                                    </Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>

                    {/* ── Main Display Card ── */}
                    <View style={styles.section}>
                        <View style={styles.cardContainer}>
                            <Animated.View style={[styles.iconContainer, { transform: [{ translateY: floatTranslate }] }]}>
                                <Image
                                    source={require('../../assets/images/img/level_1.png')}
                                    style={styles.levelIcon}
                                    contentFit="contain"
                                />
                                {renderXPBadge()}
                            </Animated.View>

                            <View style={styles.levelContainer}>
                                <Text style={styles.levelName}>{levelName}</Text>
                                <Text style={styles.levelXpText}>{totalXp} Total XP</Text>
                            </View>

                            {/* XP Progress Bar */}
                            {renderProgressBar()}

                            {/* Action Button */}
                            <Pressable style={styles.primaryBtn} onPress={handleGoNext}>
                                <Text style={styles.primaryBtnText}>Continue</Text>
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    mainWrapper: {
        flex: 1,
    },

    // Confetti
    confetti: {
        position: 'absolute',
        borderRadius: 2,
        zIndex: 10,
    },

    // Top Bar Header
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    backBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f3172',
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
    },
    streakBadgeHeader: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderWidth: 1,
        borderColor: '#EAECF0',
        elevation: 2,
    },
    streakTextHeader: {
        color: '#0f3172',
        fontSize: 13,
        fontWeight: '700',
    },

    // Section Layout
    section: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },

    // Hero Banner Card
    bannerWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#0d326b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 5,
    },
    bannerCard: {
        padding: 20,
        minHeight: 100,
        justifyContent: 'center',
    },
    bannerContent: {
        zIndex: 2,
    },
    bannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    bannerSubtitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FDE68A',
        letterSpacing: 0.8,
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    pillCount: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    pillCountText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFF',
    },

    // Main Card Container
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#EAECF0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 3,
        alignItems: 'center',
    },

    // Level Icon & Floating Badge
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginVertical: 12,
    },
    levelIcon: {
        width: 170,
        height: 170,
    },
    xpGainBadge: {
        position: 'absolute',
        top: -6,
        right: -10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        gap: 4,
        zIndex: 10,
    },
    xpGainText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },

    levelContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    levelName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f3172',
    },
    levelXpText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },

    // Progress Bar
    progressBarContainer: {
        width: '100%',
        marginVertical: 20,
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    progressBarTrack: {
        height: 14,
        backgroundColor: '#E2E8F0',
        borderRadius: 7,
        overflow: 'hidden',
    },
    progressBarFillContainer: {
        height: '100%',
        borderRadius: 7,
        overflow: 'hidden',
    },
    progressBarFillGradient: {
        width: '100%',
        height: '100%',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        width: '100%',
    },
    progressLabelText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },

    // Primary Action Button
    primaryBtn: {
        width: '100%',
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 4,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});