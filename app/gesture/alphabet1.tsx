// app/gesture/alphabet1.tsx - Expo Go Compatible
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const alphabetChallenges = [
    { letter: 'A', emoji: '✊', hint: 'Closed fist — thumb resting on side', color: '#FF6B6B' },
    { letter: 'B', emoji: '🖐', hint: 'Four fingers up, thumb across palm', color: '#4ECDC4' },
    { letter: 'C', emoji: '🤏', hint: 'Curve fingers and thumb to form C', color: '#45B7AA' },
    { letter: 'D', emoji: '👆', hint: 'Index finger up, others touch thumb', color: '#FFB6C1' },
    { letter: 'E', emoji: '🤛', hint: 'All fingers bent toward palm', color: '#FF8E9E' },
    { letter: 'F', emoji: '👌', hint: 'Index and thumb form circle', color: '#A8E6CF' },
    { letter: 'G', emoji: '👉', hint: 'Index finger points sideways', color: '#88D8B0' },
    { letter: 'H', emoji: '✌️', hint: 'Index and middle fingers up', color: '#FFD93D' },
    { letter: 'I', emoji: '🤙', hint: 'Pinky finger up', color: '#6BCB77' },
    { letter: 'J', emoji: '🤞', hint: 'Pinky draws a J shape', color: '#4D96FF' },
    { letter: 'K', emoji: '🤟', hint: 'Index and middle point up, thumb between', color: '#9B59B6' },
    { letter: 'L', emoji: '🤘', hint: 'Index and thumb form L shape', color: '#3498DB' },
    { letter: 'M', emoji: '🤔', hint: 'Three fingers over thumb', color: '#E67E22' },
];

function ResultModal({ visible, score, total, onClose, onRetry }: {
    visible: boolean; score: number; total: number; onClose: () => void; onRetry: () => void;
}) {
    const pct = Math.round((score / total) * 100);
    const { label, color, emoji } =
        pct === 100 ? { label: 'Perfect Mastery!', color: '#F59E0B', emoji: '🏆' } :
            pct >= 80 ? { label: 'Great Job!', color: '#10B981', emoji: '🌟' } :
                pct >= 60 ? { label: 'Well Done!', color: '#3B82F6', emoji: '👍' } :
                    { label: 'Keep Practicing!', color: '#EF4444', emoji: '💪' };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                        <Image source={require('../../assets/images/img/senya_teaching.png')} style={styles.resultSenyaImg} contentFit="contain" />
                        <Text style={styles.resultEmoji}>{emoji}</Text>
                        <Text style={[styles.resultTitle, { color }]}>{label}</Text>
                        <Text style={styles.resultSub}>You mastered {score} out of {total} alphabet signs!</Text>
                    </View>

                    <View style={styles.scoreContainer}>
                        <View style={styles.scoreStat}>
                            <Text style={styles.scoreNumber}>{score}</Text>
                            <Text style={styles.scoreLabel}>Correct</Text>
                        </View>
                        <View style={styles.scoreDivider} />
                        <View style={styles.scoreStat}>
                            <Text style={[styles.scoreNumber, { color: '#F59E0B' }]}>+{score * 15}</Text>
                            <Text style={styles.scoreLabel}>XP Earned</Text>
                        </View>
                    </View>

                    <View style={styles.resultModalBtns}>
                        <Pressable style={styles.retryBtn} onPress={onRetry}>
                            <Ionicons name="refresh-outline" size={20} color="#475569" />
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </Pressable>
                        <Pressable style={styles.doneBtn} onPress={onClose}>
                            <Text style={styles.doneBtnText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function Alphabet1Screen() {
    const router = useRouter();
    const [challengeIdx, setChallengeIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
    const [showResult, setShowResult] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const challenge = alphabetChallenges[challengeIdx];

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const handlePress = () => {
        const success = Math.random() > 0.3;
        if (success) {
            setCompletedIds(prev => new Set([...prev, challengeIdx]));
            setScore(s => s + 1);

            setTimeout(() => {
                if (challengeIdx < alphabetChallenges.length - 1) {
                    setChallengeIdx(challengeIdx + 1);
                } else {
                    setShowResult(true);
                }
            }, 300);
        }
    };

    const handleRetry = () => {
        setChallengeIdx(0);
        setScore(0);
        setCompletedIds(new Set());
        setShowResult(false);
    };

    const progressPct = ((challengeIdx + 1) / alphabetChallenges.length) * 100;

    if (!isLoaded) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading AI Studio Viewfinder...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ResultModal
                visible={showResult}
                score={score}
                total={alphabetChallenges.length}
                onClose={() => router.push('/(tabs)/gesture')}
                onRetry={handleRetry}
            />

            {/* Sticky Modern Top Header */}
            <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} style={styles.iconCircle}>
                    <Ionicons name="close" size={22} color="#1E293B" />
                </Pressable>

                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                </View>

                <View style={styles.counterBadge}>
                    <Text style={styles.counterText}>{challengeIdx + 1}/{alphabetChallenges.length}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Hero Target Visual Indicator */}
                <View style={styles.heroHeader}>
                    <View style={[styles.heroBadge, { backgroundColor: challenge.color + '18' }]}>
                        <Text style={[styles.heroLetter, { color: challenge.color }]}>{challenge.letter}</Text>
                    </View>
                    <View style={styles.heroTextContent}>
                        <Text style={styles.heroSubtitle}>CURRENT TARGET</Text>
                        <Text style={styles.heroTitle}>Sign the Letter "{challenge.letter}"</Text>
                    </View>
                </View>

                {/* Viewfinder Section */}
                <View style={styles.viewfinderCard}>
                    <View style={styles.viewfinderFrame}>
                        {/* Frame HUD Corners */}
                        <View style={[styles.hudCorner, styles.topL]} />
                        <View style={[styles.hudCorner, styles.topR]} />
                        <View style={[styles.hudCorner, styles.botL]} />
                        <View style={[styles.hudCorner, styles.botR]} />

                        {/* Top HUD Pill */}
                        <View style={styles.hudHeader}>
                            <View style={styles.statusPulse} />
                            <Text style={styles.statusText}>AI GESTURE ENGINE READY</Text>
                        </View>

                        {/* Frame Center Overlay */}
                        <View style={styles.centerGuide}>
                            <Text style={styles.guideEmoji}>{challenge.emoji}</Text>
                            <Text style={styles.guideText}>Place hand clearly inside frame</Text>
                        </View>

                        {/* Bottom Hint Bubble */}
                        <View style={styles.hintContainer}>
                            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                            <Text style={styles.hintText}>{challenge.hint}</Text>
                        </View>
                    </View>
                </View>

                {/* Main Interactive Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.primaryBtn,
                        { backgroundColor: challenge.color },
                        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }
                    ]}
                    onPress={handlePress}
                >
                    <Ionicons name="scan-circle" size={24} color="#fff" />
                    <Text style={styles.primaryBtnText}>Recognize Gesture</Text>
                </Pressable>

                {/* Horizontal Alphabet Selector Carousel */}
                <View style={styles.carouselSection}>
                    <Text style={styles.sectionHeaderTitle}>Select Practice Letter</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselScroll}>
                        {alphabetChallenges.map((item, i) => {
                            const active = i === challengeIdx;
                            const isDone = completedIds.has(i);

                            return (
                                <Pressable
                                    key={i}
                                    style={[
                                        styles.chip,
                                        active && { borderColor: item.color, backgroundColor: '#fff', elevation: 4 },
                                        isDone && styles.chipDone
                                    ]}
                                    onPress={() => setChallengeIdx(i)}
                                >
                                    {isDone ? (
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.chipCheck} />
                                    ) : null}
                                    <Text style={[styles.chipLetter, active && { color: item.color, fontWeight: '800' }]}>
                                        {item.letter}
                                    </Text>
                                    <Text style={styles.chipEmoji}>{item.emoji}</Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Coach Tip Box */}
                <View style={styles.coachCard}>
                    <Image source={require('../../assets/images/img/senya_blue.png')} style={styles.coachAvatar} contentFit="contain" />
                    <View style={styles.coachTextWrapper}>
                        <Text style={styles.coachTitle}>Senya's Tip</Text>
                        <Text style={styles.coachBody}>Keep your hand still and ensure good room lighting for smooth gesture matching!</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
    },

    /* Top Bar Header */
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 12,
        backgroundColor: '#F8FAFC',
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: '#E2E8F0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2563EB',
        borderRadius: 5,
    },
    counterBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    counterText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2563EB',
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },

    /* Hero Target Display */
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 14,
        gap: 14,
    },
    heroBadge: {
        width: 54,
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroLetter: {
        fontSize: 28,
        fontWeight: '900',
    },
    heroTextContent: {
        flex: 1,
    },
    heroSubtitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 2,
    },

    /* Viewfinder Card */
    viewfinderCard: {
        backgroundColor: '#0F172A',
        borderRadius: 24,
        padding: 8,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
        marginBottom: 18,
    },
    viewfinderFrame: {
        height: 240,
        borderRadius: 18,
        backgroundColor: '#1E293B',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    hudCorner: {
        position: 'absolute',
        width: 22,
        height: 22,
        borderColor: '#38BDF8',
    },
    topL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
    topR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
    botL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
    botR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },

    hudHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusPulse: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#E2E8F0',
        letterSpacing: 0.5,
    },
    centerGuide: {
        alignItems: 'center',
    },
    guideEmoji: {
        fontSize: 48,
        marginBottom: 6,
    },
    guideText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
        width: '100%',
    },
    hintText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#F8FAFC',
        flex: 1,
    },

    /* Main CTA Button */
    primaryBtn: {
        flexDirection: 'row',
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 24,
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },

    /* Carousel Section */
    carouselSection: {
        marginBottom: 20,
    },
    sectionHeaderTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    carouselScroll: {
        gap: 10,
        paddingRight: 10,
    },
    chip: {
        width: 64,
        height: 74,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    chipDone: {
        backgroundColor: '#ECFDF5',
    },
    chipCheck: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    chipLetter: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
    },
    chipEmoji: {
        fontSize: 18,
        marginTop: 2,
    },

    /* Coach Box */
    coachCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        gap: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    coachAvatar: {
        width: 44,
        height: 44,
    },
    coachTextWrapper: {
        flex: 1,
    },
    coachTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
    },
    coachBody: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 16,
        marginTop: 2,
    },

    /* Result Modal */
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'flex-end',
    },
    resultCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        alignItems: 'center',
    },
    resultHeader: {
        alignItems: 'center',
    },
    resultSenyaImg: {
        width: 80,
        height: 80,
        marginBottom: -10,
    },
    resultEmoji: {
        fontSize: 32,
        marginBottom: 4,
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: '900',
    },
    resultSub: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 4,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 32,
        marginVertical: 20,
        width: '100%',
        justifyContent: 'space-around',
    },
    scoreStat: {
        alignItems: 'center',
    },
    scoreNumber: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0F172A',
    },
    scoreLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        marginTop: 2,
    },
    scoreDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E2E8F0',
    },
    resultModalBtns: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    retryBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 50,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    retryBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#475569',
    },
    doneBtn: {
        flex: 1.5,
        flexDirection: 'row',
        height: 50,
        borderRadius: 16,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    doneBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});