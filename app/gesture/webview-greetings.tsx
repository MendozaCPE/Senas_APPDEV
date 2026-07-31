// app/gesture/webview-greetings.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Linking,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import WebView from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// ─── SVG Icons — same set used in webview-camera.tsx ─────────────────────
function StarIcon({ size = 16, color = '#F59E0B' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </Svg>
    );
}
function CheckIcon({ size = 16, color = '#fff' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12" />
        </Svg>
    );
}

// ─── SOUND EFFECTS ──────────────────────────────────────────────────────────
const CORRECT_GESTURE_SOUND = require('../../assets/music/correct-gesture.mp3');
const GESTURE_COMPLETE_SOUND = require('../../assets/music/gesture-complete.mp3');

const GREETINGS_LIST = ['HELLO', 'THANK YOU', 'SEE YOU TOMORROW', 'HOW ARE YOU', 'NICE TO MEET YOU'];

const SENYA_MESSAGES = {
    welcome: "Let's learn some greetings! 👋",
    correct: [
        "Amazing! You're a natural! ✨",
        "Perfect! Keep going! 🔥",
        "Great job! You're on fire! 🌟",
        "Wonderful! You're crushing it! 💪",
        "Fantastic! Next one! 🎉",
    ],
    struggle: [
        "Try keeping your hand steady... 💡",
        "Make the shape clearer! 👀",
        "You got this! Try again! 💪",
        "Almost there! One more try! 🌟",
    ],
    complete: 'YOU DID IT! ALL 5 GREETINGS! 🎉',
};

interface GreetingAttempt {
    greeting: string;
    attempts: number;
    wrongAttempts: number;
    firstSuccess?: number;
    lastAttempt?: number;
    successCount: number;
}

export default function WebViewGreetingsScreen() {
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const [loading, setLoading] = useState(true);
    const [detectedGreeting, setDetectedGreeting] = useState('✋');
    const [confidence, setConfidence] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    // ── Audio state ──
    const [gestureSound, setGestureSound] = useState<Audio.Sound | null>(null);
    const [completeSound, setCompleteSound] = useState<Audio.Sound | null>(null);
    const [isSoundPlaying, setIsSoundPlaying] = useState<boolean>(false);

    // Gamification state
    const [completedGreetings, setCompletedGreetings] = useState<Set<string>>(new Set());
    const [currentTarget, setCurrentTarget] = useState('HELLO');
    const [senyaMessage, setSenyaMessage] = useState(SENYA_MESSAGES.welcome);
    const [consecutiveWrong, setConsecutiveWrong] = useState(0);
    const [isModuleComplete, setIsModuleComplete] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [starRating, setStarRating] = useState(0);

    const [greetingAttempts, setGreetingAttempts] = useState<Record<string, GreetingAttempt>>({});
    const [totalWrongAttempts, setTotalWrongAttempts] = useState(0);
    const [totalCorrectAttempts, setTotalCorrectAttempts] = useState(0);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [endTime, setEndTime] = useState<number | null>(null);

    const popupAnim = useState(new Animated.Value(0))[0];
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupSubMessage, setPopupSubMessage] = useState('');

    const [lastProcessedGreeting, setLastProcessedGreeting] = useState<string>('');
    const [greetingStableCount, setGreetingStableCount] = useState(0);

    const senyaMsgCooldownRef = useRef<number>(0);
    const SENYA_COOLDOWN_MS = 3000;

    const starAnim1 = useRef(new Animated.Value(0)).current;
    const starAnim2 = useRef(new Animated.Value(0)).current;
    const starAnim3 = useRef(new Animated.Value(0)).current;

    const greetingNodePositions = useRef<Record<string, number>>({});
    const greetingNodeWidths = useRef<Record<string, number>>({});
    const greetingTrackWidth = useRef<number>(0);

    const [modelLoading, setModelLoading] = useState(true);

    const savedGreetingsRef = useRef<Set<string>>(new Set());
    const lastAttemptGreetingRef = useRef<string>('');
    const lastAttemptTimeRef = useRef<number>(0);
    const MIN_ATTEMPT_INTERVAL = 1000;

    // ── Sound Functions ──
    async function playGestureSound() {
        try {
            if (isSoundPlaying) return;
            setIsSoundPlaying(true);
            if (gestureSound) await gestureSound.unloadAsync();
            const { sound } = await Audio.Sound.createAsync(
                CORRECT_GESTURE_SOUND,
                { shouldPlay: true, isLooping: false, volume: 0.8 }
            );
            setGestureSound(sound);
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                    setGestureSound(null);
                    setIsSoundPlaying(false);
                }
            });
        } catch (error) {
            console.error('Failed to play gesture sound:', error);
            setIsSoundPlaying(false);
        }
    }

    async function playCompleteSound() {
        try {
            if (completeSound) await completeSound.unloadAsync();
            const { sound } = await Audio.Sound.createAsync(
                GESTURE_COMPLETE_SOUND,
                { shouldPlay: true, isLooping: false, volume: 1.0 }
            );
            setCompleteSound(sound);
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                    setCompleteSound(null);
                }
            });
        } catch (error) {
            console.error('Failed to play complete sound:', error);
        }
    }

    // ── Helpers ──
    const getCurrentTarget = () => {
        for (const greeting of GREETINGS_LIST) {
            if (!completedGreetings.has(greeting)) return greeting;
        }
        return null;
    };

    const getRandomMessage = (messages: string[]) => messages[Math.floor(Math.random() * messages.length)];

    const showCutePopup = (message: string, subMessage: string = '') => {
        setPopupMessage(message);
        setPopupSubMessage(subMessage);
        setShowPopup(true);
        popupAnim.setValue(0);
        Animated.spring(popupAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
        setTimeout(() => {
            Animated.timing(popupAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setShowPopup(false));
        }, 1200);
    };

    // ── Init ──
    useEffect(() => {
        const initial: Record<string, GreetingAttempt> = {};
        GREETINGS_LIST.forEach(greeting => {
            initial[greeting] = { greeting, attempts: 0, wrongAttempts: 0, successCount: 0 };
        });
        setGreetingAttempts(initial);
        setStartTime(Date.now());
        setEndTime(null);
        return () => {
            if (gestureSound) gestureSound.unloadAsync();
            if (completeSound) completeSound.unloadAsync();
        };
    }, []);

    useEffect(() => {
        const target = getCurrentTarget();
        if (target) {
            setCurrentTarget(target);
        } else if (completedGreetings.size === GREETINGS_LIST.length) {
            setIsModuleComplete(true);
            setSenyaMessage(SENYA_MESSAGES.complete);
            const endNow = Date.now();
            setEndTime(endNow);
            const elapsed = Math.round((endNow - startTime) / 1000);
            setStarRating(elapsed < 30 ? 3 : elapsed < 60 ? 2 : 1);
            playCompleteSound();
            saveAllPerformance();
            setTimeout(() => setShowResults(true), 1500);
        }
    }, [completedGreetings]);

    // Keep the greeting path scrolled so the current target stays visible
    useEffect(() => {
        const timeout = setTimeout(() => {
            const x = greetingNodePositions.current[currentTarget];
            if (x === undefined || !scrollViewRef.current) return;
            const nodeWidth = greetingNodeWidths.current[currentTarget] || 76;
            const visibleWidth = greetingTrackWidth.current || width - 24;
            const centerOffset = Math.max(0, (visibleWidth / 2) - (nodeWidth / 2));
            scrollViewRef.current.scrollTo({ x: Math.max(0, x - centerOffset), animated: true });
        }, 120);
        return () => clearTimeout(timeout);
    }, [currentTarget]);

    useEffect(() => {
        if (showResults) {
            starAnim1.setValue(0);
            starAnim2.setValue(0);
            starAnim3.setValue(0);
            setTimeout(() => Animated.spring(starAnim1, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start(), 300);
            setTimeout(() => Animated.spring(starAnim2, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start(), 550);
            setTimeout(() => Animated.spring(starAnim3, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start(), 800);
        }
    }, [showResults]);

    // ── Detection handling ──
    const handleDetection = async (data: any) => {
        const { greeting } = data;
        if (!(greeting && greeting !== '✋' && greeting !== '...' && GREETINGS_LIST.includes(greeting))) return;

        if (greeting === lastProcessedGreeting) {
            setGreetingStableCount(prev => prev + 1);
        } else {
            setLastProcessedGreeting(greeting);
            setGreetingStableCount(0);
            return;
        }
        if (greetingStableCount < 2) return;

        const now = Date.now();
        const isNewGreeting = greeting !== lastAttemptGreetingRef.current;
        const isTimeForNewAttempt = now - lastAttemptTimeRef.current >= MIN_ATTEMPT_INTERVAL;

        if (isNewGreeting || isTimeForNewAttempt) {
            lastAttemptGreetingRef.current = greeting;
            lastAttemptTimeRef.current = now;
            setGreetingAttempts(prev => {
                const current = prev[greeting] || { greeting, attempts: 0, wrongAttempts: 0, successCount: 0 };
                return { ...prev, [greeting]: { ...current, attempts: current.attempts + 1, lastAttempt: Date.now() } };
            });
        }

        const target = getCurrentTarget();

        if (greeting === target) {
            if (!completedGreetings.has(greeting)) {
                await playGestureSound();
                const newCompleted = new Set(completedGreetings);
                newCompleted.add(greeting);
                setCompletedGreetings(newCompleted);
                setConsecutiveWrong(0);
                setTotalCorrectAttempts(prev => prev + 1);
                setGreetingAttempts(prev => {
                    const current = prev[greeting] || { greeting, attempts: 0, wrongAttempts: 0, successCount: 0 };
                    return { ...prev, [greeting]: { ...current, successCount: current.successCount + 1, firstSuccess: current.firstSuccess || Date.now() } };
                });
                savedGreetingsRef.current.add(greeting);
                const msg = getRandomMessage(SENYA_MESSAGES.correct);
                setSenyaMessage(msg);
                senyaMsgCooldownRef.current = Date.now();
                showCutePopup(`✓ ${greeting}`, `${completedGreetings.size + 1}/${GREETINGS_LIST.length}`);
            }
        } else if (completedGreetings.has(greeting)) {
            const now2 = Date.now();
            if (now2 - senyaMsgCooldownRef.current >= SENYA_COOLDOWN_MS) {
                senyaMsgCooldownRef.current = now2;
                setSenyaMessage(target ? `You got ${greeting}! Try ${target} 🌟` : SENYA_MESSAGES.complete);
            }
            setConsecutiveWrong(0);
        } else {
            if (greetingStableCount >= 2 && (isNewGreeting || isTimeForNewAttempt)) {
                const newWrong = consecutiveWrong + 1;
                setConsecutiveWrong(newWrong);
                setTotalWrongAttempts(prev => prev + 1);
                if (target) {
                    setGreetingAttempts(prev => {
                        const current = prev[target] || { greeting: target, attempts: 0, wrongAttempts: 0, successCount: 0 };
                        return { ...prev, [target]: { ...current, wrongAttempts: current.wrongAttempts + 1 } };
                    });
                }
                const now3 = Date.now();
                if (now3 - senyaMsgCooldownRef.current >= SENYA_COOLDOWN_MS) {
                    senyaMsgCooldownRef.current = now3;
                    if (newWrong >= 4) {
                        setSenyaMessage(getRandomMessage(SENYA_MESSAGES.struggle));
                        setConsecutiveWrong(0);
                        showCutePopup(`💡 ${target}`, 'Keep your hands steady');
                    } else if (newWrong >= 2) {
                        setSenyaMessage(`Try making ${target} shape! 💪`);
                    }
                }
            }
        }
    };

    const saveAllPerformance = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return null;
            const greetingPerformances = GREETINGS_LIST.map(greeting => {
                const data = greetingAttempts[greeting] || { greeting, attempts: 0, wrongAttempts: 0, successCount: 0 };
                return {
                    greeting,
                    attempts: data.attempts || 0,
                    wrong_attempts: data.wrongAttempts || 0,
                    success_count: data.successCount || 0,
                    consecutive_wrong: 0,
                };
            });
            const totalAttempts = greetingPerformances.reduce((sum, g) => sum + g.attempts, 0);
            if (totalAttempts === 0) return null;
            return { success: true };
        } catch (error) {
            console.error('Error saving performance:', error);
            return null;
        }
    };

    const preloadModel = async () => {
        try {
            const response = await fetch('https://prude-overpay-grievance.ngrok-free.dev/models/model.json');
            if (response.ok) console.log('✅ Model pre-loaded');
        } catch (error) {
            console.error('Pre-load failed:', error);
        }
    };
    useEffect(() => { preloadModel(); }, []);

    const GREETINGS_URL = 'https://prude-overpay-grievance.ngrok-free.dev/gesture_greetings.html';

    // ── Injected JS — hides the page's own HUD, same approach as camera screen ──
    const injectedJavaScript = `
        (function() {
            var HUD_SELECTORS = [
                '#detection-box', '.progress-bar', '#status-bar', '#overlay',
                '.hud', '.status', '.status-badge', '.badge', '.controls',
                '.detection-label', '.connection-status', '#connection-indicator',
                '.letter-display', '.confidence-bar', '.detected-label',
                '[class*="status"]', '[class*="hud"]', '[class*="detect"]',
                '[id*="status"]', '[id*="hud"]', '[id*="detect"]'
            ];

            function hideNativeUI() {
                HUD_SELECTORS.forEach(function(sel) {
                    try {
                        document.querySelectorAll(sel).forEach(function(el) {
                            el.style.setProperty('display', 'none', 'important');
                            el.style.setProperty('visibility', 'hidden', 'important');
                        });
                    } catch (e) {}
                });

                var container = document.getElementById('container');
                if (container) {
                    container.style.position = 'absolute';
                    container.style.top = '0';
                    container.style.left = '0';
                    container.style.width = '100%';
                    container.style.height = '100%';
                }

                document.querySelectorAll('video, canvas').forEach(function(el) {
                    el.style.width = '100%';
                    el.style.height = '100%';
                    el.style.objectFit = 'cover';
                });
            }

            hideNativeUI();
            var observer = new MutationObserver(hideNativeUI);
            observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        })();
        true;
    `;

    const openInBrowser = async () => {
        try {
            const urlWithHeader = GREETINGS_URL + '?ngrok-skip-browser-warning=true';
            await WebBrowser.openBrowserAsync(urlWithHeader);
        } catch (error) {
            Linking.openURL(GREETINGS_URL);
        }
    };

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'model_status') {
                setModelLoading(true);
                if (data.status === 'loaded') {
                    setModelLoading(false);
                    setLoading(false);
                    setIsConnected(true);
                }
                return;
            }
            if (data.type === 'model_error') {
                setModelLoading(false);
                setLoading(false);
                setSenyaMessage(`Error: ${data.error}`);
                return;
            }
            if (data.type === 'model_ready' || data.status === 'all_loaded') {
                setIsConnected(true);
                setLoading(false);
                setModelLoading(false);
                return;
            }
            if (data.type === 'mediapipe_ready') return;
            if (data.test) {
                setIsConnected(true);
                setLoading(false);
                setModelLoading(false);
                return;
            }

            const detectedValue = data.greeting || data.letter || '';
            const confidenceValue = data.confidence || 0;

            if (!detectedValue || detectedValue === '' || detectedValue === '✋' || detectedValue === '...') {
                setDetectedGreeting('✋');
                setConfidence(0);
                setGreetingStableCount(0);
                return;
            }

            if (GREETINGS_LIST.includes(detectedValue)) {
                setDetectedGreeting(detectedValue);
                setConfidence(confidenceValue);
                setIsConnected(true);
                handleDetection(data);
            } else {
                setDetectedGreeting(detectedValue);
                setConfidence(confidenceValue);
            }
        } catch (error) {
            console.error('Message error:', error);
        }
    };

    const getResults = () => {
        const timeToUse = endTime || Date.now();
        const totalSecs = Math.round((timeToUse - startTime) / 1000);
        const minutes = Math.floor(totalSecs / 60);
        const seconds = totalSecs % 60;
        const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        const strugglingGreetings = Object.values(greetingAttempts)
            .filter(g => g.wrongAttempts >= 2)
            .sort((a, b) => b.wrongAttempts - a.wrongAttempts)
            .map(g => g.greeting)
            .slice(0, 3);
        const easyGreetings = Object.values(greetingAttempts)
            .filter(g => g.successCount > 0 && g.wrongAttempts === 0)
            .map(g => g.greeting);
        return {
            totalTime: timeDisplay,
            strugglingGreetings,
            easyGreetings,
            totalCorrect: completedGreetings.size,
            totalWrong: totalWrongAttempts,
        };
    };

    const handleContinue = async () => {
        await saveAllPerformance();
        setShowResults(false);
        router.back();
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0f3172" />
                    <Text style={styles.checkingText}>Checking permission...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Ionicons name="camera-outline" size={64} color="#4b7bbb" />
                    <Text style={styles.title}>Camera Access Required</Text>
                    <Text style={styles.subtitle}>Please grant camera permission to use gesture recognition.</Text>
                    <Pressable style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const isIdle = detectedGreeting === '✋';

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Header — identical structure to webview-camera.tsx ── */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0f3172" />
                </Pressable>
                <Text style={styles.headerTitle}>Greetings Level 1</Text>
                <View style={[styles.statusBadge, isConnected && styles.statusActive]}>
                    <Text style={[styles.statusText, isConnected && styles.statusActiveText]}>
                        {isConnected ? '🟢 Live' : '⏳ Loading'}
                    </Text>
                </View>
            </View>

            {/* ── Full-screen camera with everything floating ON TOP — nothing steals its space ── */}
            <View style={styles.webviewContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: GREETINGS_URL, headers: { 'ngrok-skip-browser-warning': 'true' } }}
                    style={styles.webview}
                    onLoadStart={() => { setLoading(true); setModelLoading(true); }}
                    onLoadEnd={() => { }}
                    onMessage={handleMessage}
                    injectedJavaScript={injectedJavaScript}
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    startInLoadingState={true}
                    originWhitelist={['*']}
                    mixedContentMode="always"
                    allowsFullscreenVideo={false}
                    scrollEnabled={false}
                    allowsAirPlayForMediaPlayback={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    cacheEnabled={true}
                    cacheMode="LOAD_DEFAULT"
                    userAgent={Platform.OS === 'android'
                        ? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36'
                        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
                    }
                />

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#FBBF24" />
                        <Text style={styles.loadingOverlayText}>Loading gesture recognition...</Text>
                        <Text style={styles.loadingSubtext}>Connecting to SEÑAS server</Text>
                    </View>
                )}

                {/* ── Overlay content — percentage/detection now sits at the top, Senya's message sits at the bottom ── */}
                <View style={styles.cameraOverlay} pointerEvents="none">
                    <View style={styles.overlayTop}>
                        <View style={[styles.detectedContainer, isIdle && styles.detectedContainerIdle]}>
                            <Ionicons name="hand-left" size={16} color={isIdle ? 'rgba(255,255,255,0.5)' : '#10B981'} />
                            <View style={[styles.detectedWordBox, isIdle && styles.detectedWordBoxIdle]}>
                                <Text
                                    style={[styles.detectedWord, isIdle && styles.detectedWordIdle]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {detectedGreeting}
                                </Text>
                            </View>
                            {confidence > 0 && (
                                <View style={styles.detectedConfidence}>
                                    <View style={styles.detectedConfidenceTrack}>
                                        <View style={[styles.detectedConfidenceFill, { width: `${Math.round(confidence)}%` }]} />
                                    </View>
                                    <Text style={styles.detectedConfidenceText}>{Math.round(confidence)}%</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.overlayBottom}>
                        <View style={styles.senyaBubble}>
                            <View style={styles.senyaBubbleTail} />
                            <Image
                                source={require('../../assets/images/img/senya_teaching.png')}
                                style={styles.overlaySenya}
                                resizeMode="contain"
                            />
                            <Text style={styles.overlaySenyaMessage} numberOfLines={2}>{senyaMessage}</Text>
                        </View>
                    </View>
                </View>

                {/* Browser fallback button */}
                {!isConnected && (
                    <TouchableOpacity style={styles.browserButton} onPress={openInBrowser} activeOpacity={0.8}>
                        <Ionicons name="open-outline" size={20} color="#fff" />
                        <Text style={styles.browserButtonText}>Open in Browser</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Greeting Path — lives below the camera, never over it ── */}
            <View style={styles.letterGridWrapper}>
                <View style={styles.letterPathLine} pointerEvents="none" />
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.letterGridScroll}
                    contentContainerStyle={styles.letterGridContent}
                    onLayout={(e) => { greetingTrackWidth.current = e.nativeEvent.layout.width; }}
                >
                    {GREETINGS_LIST.map((greeting) => {
                        const isCompleted = completedGreetings.has(greeting);
                        const isActive = greeting === currentTarget && !isCompleted;
                        const displayName = greeting.length > 12 ? greeting.substring(0, 10) + '…' : greeting;

                        return (
                            <View
                                key={greeting}
                                style={styles.letterNodeWrapper}
                                onLayout={(e) => {
                                    greetingNodePositions.current[greeting] = e.nativeEvent.layout.x;
                                    greetingNodeWidths.current[greeting] = e.nativeEvent.layout.width;
                                }}
                            >
                                {isActive && <View style={styles.activePulseRing} />}
                                <View style={[styles.letterSlot, isCompleted && styles.letterCompleted, isActive && styles.letterActive]}>
                                    <Text
                                        style={[styles.letterChar, isCompleted && styles.letterCharCompleted, isActive && styles.letterCharActive]}
                                        numberOfLines={2}
                                    >
                                        {displayName}
                                    </Text>
                                </View>
                                {isCompleted && (
                                    <View style={styles.checkBadge}>
                                        <CheckIcon size={9} color="#fff" />
                                    </View>
                                )}
                                {isActive && (
                                    <View style={styles.activeBadge}>
                                        <StarIcon size={9} color="#fff" />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Popup ── */}
            {showPopup && (
                <Animated.View style={[styles.popupContainer, { opacity: popupAnim, transform: [{ scale: popupAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1.05, 1] }) }] }]}>
                    <View style={styles.popupContent}>
                        <Image source={require('../../assets/images/img/senya_teaching.png')} style={styles.popupSenya} resizeMode="contain" />
                        <Text style={styles.popupMessage}>{popupMessage}</Text>
                        {popupSubMessage ? <Text style={styles.popupSubMessage}>{popupSubMessage}</Text> : null}
                    </View>
                </Animated.View>
            )}

            {/* ── Results Modal — same structure as webview-camera.tsx ── */}
            <Modal visible={showResults} transparent animationType="fade" onRequestClose={() => setShowResults(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <TouchableOpacity style={styles.modalClose} onPress={() => setShowResults(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={20} color="#0f3172" />
                        </TouchableOpacity>

                        <View style={styles.trophyBadge}>
                            <Ionicons name="trophy" size={32} color="#FBBF24" />
                        </View>

                        <Text style={styles.modalTitle}>You Did It! 🎉</Text>
                        <Text style={styles.modalSubtitle}>All {GREETINGS_LIST.length} greetings mastered</Text>

                        <View style={styles.starsRow}>
                            {[starAnim1, starAnim2, starAnim3].map((anim, i) => {
                                const isEarned = starRating > i;
                                return (
                                    <Animated.View key={i} style={[styles.starWrapper, i === 1 && styles.starWrapperCenter, { transform: [{ scale: anim }], opacity: anim }]}>
                                        <Ionicons name={isEarned ? 'star' : 'star-outline'} size={i === 1 ? 40 : 32} color={isEarned ? '#FBBF24' : '#D9E2EC'} />
                                    </Animated.View>
                                );
                            })}
                        </View>

                        <View style={styles.starLabelPill}>
                            <Ionicons name={starRating === 3 ? 'flash' : starRating === 2 ? 'thumbs-up' : 'leaf'} size={14} color="#0f3172" style={{ marginRight: 6 }} />
                            <Text style={styles.starLabel}>{starRating === 3 ? 'Lightning Fast! ⚡' : starRating === 2 ? 'Great Job! 🌟' : 'Keep Practicing! 💪'}</Text>
                        </View>

                        {(() => {
                            const results = getResults();
                            return (
                                <>
                                    <View style={styles.resultsGrid}>
                                        <View style={styles.resultItem}>
                                            <View style={styles.resultIconWrap}><Ionicons name="timer-outline" size={18} color="#0f3172" /></View>
                                            <Text style={styles.resultValue}>{results.totalTime}</Text>
                                            <Text style={styles.resultGridLabel}>Time</Text>
                                        </View>
                                        <View style={styles.resultItemDivider} />
                                        <View style={styles.resultItem}>
                                            <View style={styles.resultIconWrap}><Ionicons name="hand-left-outline" size={18} color="#0f3172" /></View>
                                            <Text style={styles.resultValue}>{results.totalCorrect}/{GREETINGS_LIST.length}</Text>
                                            <Text style={styles.resultGridLabel}>Greetings</Text>
                                        </View>
                                    </View>

                                    <View style={styles.senyaFeedback}>
                                        <View style={styles.feedbackHeader}>
                                            <Ionicons name="document-text-outline" size={16} color="#0f3172" />
                                            <Text style={styles.feedbackTitle}>Senya's Notes</Text>
                                        </View>
                                        {(() => {
                                            const items: { icon: any; color: string; text: string }[] = [];
                                            if (starRating === 3) items.push({ icon: 'sparkles', color: '#FBBF24', text: "You're absolutely incredible at this! 🌟" });
                                            else if (starRating === 2) items.push({ icon: 'flame', color: '#FF7A45', text: 'Great work! A bit more speed for 3 stars. 🔥' });
                                            else items.push({ icon: 'refresh', color: '#4b7bbb', text: 'Keep practicing! Your hands will get faster. 💪' });
                                            if (results.strugglingGreetings.length > 0) {
                                                items.push({ icon: 'alert-circle-outline', color: '#E11D48', text: `Need more help with: ${results.strugglingGreetings.join(', ')}` });
                                            }
                                            if (results.easyGreetings.length > 0) {
                                                items.push({ icon: 'checkmark-circle', color: '#10B981', text: `You nailed: ${results.easyGreetings.join(', ')} ✨` });
                                            }
                                            return items.map((it, i) => (
                                                <View key={i} style={styles.feedbackRow}>
                                                    <Ionicons name={it.icon} size={14} color={it.color} style={{ marginTop: 2, marginRight: 8 }} />
                                                    <Text style={styles.feedbackText}>{it.text}</Text>
                                                </View>
                                            ));
                                        })()}
                                    </View>
                                </>
                            );
                        })()}

                        <TouchableOpacity style={styles.continueButton} activeOpacity={0.85} onPress={handleContinue}>
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eaf5fd' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    checkingText: { fontSize: 16, color: '#4b7bbb', marginTop: 12 },
    title: { fontSize: 24, fontWeight: '800', color: '#0f3172', marginTop: 16, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#4b7bbb', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },
    button: { backgroundColor: '#0f3172', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 60, marginTop: 8 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: 'rgba(15,49,114,0.06)',
    },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15,49,114,0.06)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '800', color: '#0f3172' },
    statusBadge: { backgroundColor: 'rgba(200,200,200,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusActive: { backgroundColor: 'rgba(16,185,129,0.15)' },
    statusText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
    statusActiveText: { color: '#10B981' },

    // Camera fills all remaining space — nothing sits above/below it stealing room
    webviewContainer: {
        flex: 1, marginHorizontal: 8, marginVertical: 6, borderRadius: 16,
        overflow: 'hidden', backgroundColor: '#0a1628', position: 'relative',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minHeight: 300,
    },
    webview: { flex: 1, backgroundColor: '#0a1628' },
    loadingOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(10,22,40,0.95)', alignItems: 'center', justifyContent: 'center', zIndex: 20,
    },
    loadingOverlayText: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 14 },
    loadingSubtext: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 },

    // Overlay sits ON TOP of the camera (absolute, zIndex above WebView) —
    // it never pushes the camera view smaller, unlike stacked header rows.
    cameraOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 18, paddingBottom: 18, zIndex: 10,
    },
    overlayTop: { alignItems: 'center' },

    senyaBubble: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,49,114,0.72)', borderRadius: 22,
        padding: 8, paddingHorizontal: 14, gap: 8, borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
        maxWidth: width * 0.75, alignSelf: 'center',
    },
    senyaBubbleTail: {
        position: 'absolute', bottom: -7, left: '50%', marginLeft: -6, width: 12, height: 12,
        backgroundColor: 'rgba(15,49,114,0.72)', borderBottomWidth: 1, borderRightWidth: 1,
        borderColor: 'rgba(251,191,36,0.25)', transform: [{ rotate: '45deg' }],
    },
    overlaySenya: { width: 34, height: 34, borderRadius: 17 },
    overlaySenyaMessage: { fontSize: 13, fontWeight: '700', color: '#fff', flex: 1 },

    overlayBottom: { alignItems: 'center', marginBottom: 30 },
    detectedContainer: {
        backgroundColor: 'rgba(15,49,114,0.6)', borderRadius: 16, padding: 6, paddingHorizontal: 10,
        alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', flexDirection: 'row', gap: 8,
        alignSelf: 'center', maxWidth: width * 0.9,
    },
    detectedContainerIdle: { opacity: 0.55, borderColor: 'rgba(255,255,255,0.15)' },
    detectedWordBox: {
        minWidth: 40, maxWidth: width * 0.5, paddingHorizontal: 8, height: 30, borderRadius: 10,
        backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
        alignItems: 'center', justifyContent: 'center',
    },
    detectedWordBoxIdle: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
    detectedWord: { fontSize: 13, fontWeight: '900', color: '#10B981', textAlign: 'center' },
    detectedWordIdle: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
    detectedConfidence: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 56 },
    detectedConfidenceTrack: { width: 28, height: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1.5, overflow: 'hidden' },
    detectedConfidenceFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 1.5 },
    detectedConfidenceText: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', width: 24 },

    // Browser fallback button — bottom-center/left, only shows when not connected
    browserButton: {
        position: 'absolute', bottom: 20, left: 16, flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(30,75,143,0.9)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 60, gap: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', zIndex: 15,
    },
    browserButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    // Greeting path — below the camera, own fixed height, never overlaps
    letterGridWrapper: { paddingHorizontal: 6, paddingVertical: 6, position: 'relative' },
    letterPathLine: {
        position: 'absolute', left: 24, right: 24, top: '50%', height: 3, marginTop: -1.5,
        backgroundColor: 'rgba(15,49,114,0.12)', borderRadius: 2,
    },
    letterGridScroll: { maxHeight: 76 },
    letterGridContent: { paddingHorizontal: 6, gap: 8, alignItems: 'center' },
    letterNodeWrapper: { width: 76, height: 64, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
    activePulseRing: { position: 'absolute', width: 84, height: 60, borderRadius: 18, backgroundColor: 'rgba(251,191,36,0.25)' },
    letterSlot: {
        width: 74, height: 52, borderRadius: 14, paddingHorizontal: 6, backgroundColor: '#fff', borderWidth: 2,
        borderColor: 'rgba(15,49,114,0.12)', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#0f3172', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
    },
    letterCompleted: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: '#10B981' },
    letterActive: { borderColor: '#FBBF24', backgroundColor: '#FFFBEB', transform: [{ scale: 1.05 }] },
    letterChar: { fontSize: 10.5, fontWeight: '800', color: 'rgba(15,49,114,0.4)', textAlign: 'center' },
    letterCharCompleted: { color: '#10B981' },
    letterCharActive: { color: '#92400E', fontSize: 11 },
    checkBadge: {
        position: 'absolute', top: 1, right: 1, width: 16, height: 16, borderRadius: 8,
        backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
    },
    activeBadge: {
        position: 'absolute', top: 1, right: 1, width: 16, height: 16, borderRadius: 8,
        backgroundColor: '#FBBF24', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
    },

    popupContainer: { position: 'absolute', top: '30%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'none' },
    popupContent: {
        backgroundColor: 'white', borderRadius: 14, padding: 8, paddingHorizontal: 16, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
        borderWidth: 2, borderColor: '#FBBF24', minWidth: 60,
    },
    popupSenya: { width: 22, height: 22, marginBottom: 2 },
    popupMessage: { fontSize: 13, fontWeight: '700', color: '#0f3172', textAlign: 'center' },
    popupSubMessage: { fontSize: 9, color: '#4b7bbb', marginTop: 1, textAlign: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(10,22,40,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    modalCard: {
        backgroundColor: '#fff', borderRadius: 24, paddingTop: 28, paddingBottom: 20, paddingHorizontal: 20,
        width: '100%', maxWidth: 340, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 16,
    },
    modalClose: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    trophyBadge: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(251,191,36,0.12)',
        borderWidth: 2, borderColor: 'rgba(251,191,36,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f3172', textAlign: 'center' },
    modalSubtitle: { fontSize: 13, color: '#4b7bbb', marginTop: 4, textAlign: 'center' },
    starsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 14, gap: 6 },
    starWrapper: { alignItems: 'center', justifyContent: 'center' },
    starWrapperCenter: { marginBottom: 6 },
    starLabelPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251,191,36,0.12)', paddingVertical: 5, paddingHorizontal: 14, borderRadius: 999, marginTop: 10, marginBottom: 14 },
    starLabel: { fontSize: 12, fontWeight: '700', color: '#0f3172' },
    resultsGrid: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7faff',
        borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 12, width: '100%',
        borderWidth: 1, borderColor: 'rgba(15,49,114,0.06)',
    },
    resultItem: { flex: 1, alignItems: 'center' },
    resultIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(15,49,114,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    resultItemDivider: { width: 1, height: 40, backgroundColor: 'rgba(15,49,114,0.08)', marginHorizontal: 4 },
    resultValue: { fontSize: 17, fontWeight: '800', color: '#0f3172' },
    resultGridLabel: { fontSize: 9, color: '#4b7bbb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
    senyaFeedback: { backgroundColor: '#fbfcff', borderRadius: 14, padding: 12, width: '100%', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(15,49,114,0.06)' },
    feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    feedbackTitle: { fontSize: 13, fontWeight: '800', color: '#0f3172' },
    feedbackRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
    feedbackText: { flex: 1, fontSize: 12, color: '#334155', lineHeight: 17 },
    continueButton: {
        backgroundColor: '#0f3172', paddingVertical: 13, paddingHorizontal: 24, borderRadius: 999, width: '100%',
        alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
        shadowColor: '#0f3172', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
    },
    continueButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});