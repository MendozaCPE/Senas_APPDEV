// app/quiz/dnd.tsx
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ══ DATA ══════════════════════════════════════════════════════════════ */
const MATCH_PAIRS = [
  { id: 0, emoji: '✊', letter: 'A', match: 'Closed fist, thumb on side', fact: "'A' is a closed fist with your thumb resting on the side of your index finger.", color: ['#7C3AED', '#6D28D9'] as const, soft: '#F5F3FF' },
  { id: 1, emoji: '👋', letter: 'HELLO', match: 'Hello / Hi', fact: "An open hand wave is the universal 'Hello / Hi' greeting!", color: ['#0EA5E9', '#0284C7'] as const, soft: '#EFF9FF' },
  { id: 2, emoji: '🙏', letter: 'THANKS', match: 'Open hand from chin', fact: "'Thank You' is an open flat hand moving forward from the chin — like blowing gratitude!", color: ['#F59E0B', '#D97706'] as const, soft: '#FFFBEB' },
  { id: 3, emoji: '🖐', letter: 'B', match: 'Four fingers up, thumb across', fact: "'B' uses four fingers held straight up, thumb folded across the palm.", color: ['#10B981', '#059669'] as const, soft: '#ECFDF5' },
  { id: 4, emoji: '🤲', letter: 'PLEASE', match: 'Flat hand circling chest', fact: "'Please' is a flat open hand rubbing a circle on your chest!", color: ['#EC4899', '#DB2777'] as const, soft: '#FDF2F8' },
];

type Rect = { x: number; y: number; width: number; height: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Nearest-zone hit test with a forgiving margin — kid fingers are imprecise. */
function findZoneAt(px: number, py: number, rects: Record<number, Rect>, pad = 26): number | null {
  let best: number | null = null;
  let bestDist = Infinity;
  for (const key in rects) {
    const r = rects[key];
    if (!r) continue;
    if (px >= r.x - pad && px <= r.x + r.width + pad && py >= r.y - pad && py <= r.y + r.height + pad) {
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      const d = (px - cx) ** 2 + (py - cy) ** 2;
      if (d < bestDist) { bestDist = d; best = Number(key); }
    }
  }
  return best;
}

/* ══ Icons ═════════════════════════════════════════════════════════════ */
function CloseIcon({ size = 15, color = '#6B7280' }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round"><Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" /></Svg>;
}
function CheckCircleIcon({ color = '#10B981', size = 18 }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><Polyline points="8 12 11 15 16 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
function GripIcon({ size = 12, color = 'rgba(255,255,255,0.75)' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx="8" cy="6" r="1.6" /><Circle cx="16" cy="6" r="1.6" />
      <Circle cx="8" cy="12" r="1.6" /><Circle cx="16" cy="12" r="1.6" />
      <Circle cx="8" cy="18" r="1.6" /><Circle cx="16" cy="18" r="1.6" />
    </Svg>
  );
}
function TrophyIcon({ size = 16, color = '#F59E0B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 21h8" /><Path d="M12 17v4" />
      <Path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <Path d="M7 5H4a2 2 0 0 0 0 4h3" />
      <Path d="M17 5h3a2 2 0 0 1 0 4h-3" />
    </Svg>
  );
}
function StarIcon({ size = 14, color = '#F59E0B' }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></Svg>;
}
function SparkleIcon({ size = 12, color = '#fff' }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" /></Svg>;
}

/* ══ Clouds — same motif as dashboard / lessons / profile ═════════════ */
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
    default:
      return (
        <>
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: cw * 0.38, height: ch * 0.65, borderRadius: 999, backgroundColor: w }} />
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
    const loop = Animated.loop(
      Animated.timing(translateX, { toValue: trackWidth + trackWidth * 0.5, duration, easing: Easing.linear, useNativeDriver: true })
    );
    Animated.timing(translateX, {
      toValue: trackWidth + trackWidth * 0.5,
      duration: firstDuration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      translateX.setValue(-trackWidth * 0.5);
      loop.start();
    });
    return () => { loop.stop(); translateX.stopAnimation(); };
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

/* ══ Exit Modal ════════════════════════════════════════════════════════ */
function ExitModal({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.exitModal} onPress={e => e.stopPropagation()}>
          <View style={s.exitIconBox}>
            <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <Polyline points="16 17 21 12 16 7" />
              <Line x1="21" y1="12" x2="9" y2="12" />
            </Svg>
          </View>
          <Text style={s.exitTitle}>Exit Quiz?</Text>
          <Text style={s.exitDesc}>Your progress will be lost. Are you sure you want to exit?</Text>
          <View style={s.exitBtns}>
            <Pressable style={s.stayBtn} onPress={onClose}><Text style={s.stayText}>Stay & Learn</Text></Pressable>
            <Pressable style={s.exitConfirmBtn} onPress={onConfirm}><Text style={s.exitConfirmText}>Exit</Text></Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ══ Confetti burst (lightweight, native driver) ══════════════════════ */
function Burst({ trigger }: { trigger: number }) {
  const bits = useMemo(
    () => Array.from({ length: 14 }).map((_, i) => ({
      i,
      dx: (Math.random() - 0.5) * 220,
      dy: -80 - Math.random() * 160,
      color: ['#FCD34D', '#34D399', '#60A5FA', '#F472B6', '#A78BFA'][i % 5],
      size: 7 + Math.random() * 7,
    })),
    [trigger]
  );
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    t.setValue(0);
    Animated.timing(t, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [trigger]);

  if (!trigger) return null;

  return (
    <View pointerEvents="none" style={s.burstLayer}>
      {bits.map(b => (
        <Animated.View
          key={b.i}
          style={{
            position: 'absolute',
            width: b.size,
            height: b.size,
            borderRadius: 2,
            backgroundColor: b.color,
            opacity: t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, b.dx] }) },
              { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, b.dy] }) },
              { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '420deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/* ══ Draggable chip ════════════════════════════════════════════════════
   Freeze fixes:
   • PanResponder built once with refs for all callbacks (no stale closures)
   • Everything animates on the native driver — no JS-thread layout thrash
   • The idle "breathe" loop is stopped the moment a drag starts
   • onMoveShouldSetPanResponder uses a small threshold so ScrollView
     never fights the chip for the gesture
   • Drop zones are re-measured on scroll + on drag start, so stale rects
     can't swallow a drop
════════════════════════════════════════════════════════════════════════ */
function DraggableChip({
  pair, zoneRectsRef, onCorrectMatch, onWrongAttempt, setHoverZoneId, onDragStateChange, remeasure,
}: {
  pair: typeof MATCH_PAIRS[number];
  zoneRectsRef: React.MutableRefObject<Record<number, Rect>>;
  onCorrectMatch: (id: number) => void;
  onWrongAttempt: (id: number, targetId: number) => void;
  setHoverZoneId: (id: number | null) => void;
  onDragStateChange: (dragging: boolean) => void;
  remeasure: () => void;
}) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current; // 0 idle, 1 dragging
  const wiggle = useRef(new Animated.Value(0)).current;

  const [dragging, setDragging] = useState(false);
  const lastHover = useRef<number | null>(null);
  const wiggleLoop = useRef<Animated.CompositeAnimation | null>(null);

  // keep latest callbacks in refs so the PanResponder never goes stale
  const cbs = useRef({ onCorrectMatch, onWrongAttempt, setHoverZoneId, onDragStateChange, remeasure });
  cbs.current = { onCorrectMatch, onWrongAttempt, setHoverZoneId, onDragStateChange, remeasure };

  const startWiggle = useCallback(() => {
    wiggleLoop.current?.stop();
    wiggle.setValue(0);
    wiggleLoop.current = Animated.loop(
      Animated.sequence([
        Animated.delay(1400 + pair.id * 220),
        Animated.timing(wiggle, { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 130, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 130, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    wiggleLoop.current.start();
  }, [pair.id]);

  useEffect(() => {
    startWiggle();
    return () => { wiggleLoop.current?.stop(); };
  }, [startWiggle]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderTerminationRequest: () => false, // ScrollView can't steal mid-drag
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: () => {
        wiggleLoop.current?.stop();
        wiggle.setValue(0);
        setDragging(true);
        cbs.current.onDragStateChange(true);
        cbs.current.remeasure();
        pan.setValue({ x: 0, y: 0 });
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.18, friction: 5, tension: 120, useNativeDriver: true }),
          Animated.timing(lift, { toValue: 1, duration: 140, useNativeDriver: true }),
        ]).start();
      },

      onPanResponderMove: (_e, g) => {
        pan.setValue({ x: g.dx, y: g.dy });
        const hit = findZoneAt(g.moveX, g.moveY, zoneRectsRef.current);
        if (hit !== lastHover.current) {
          lastHover.current = hit;
          cbs.current.setHoverZoneId(hit); // only on change — no per-frame setState
        }
      },

      onPanResponderRelease: (_e, g) => {
        const hit = findZoneAt(g.moveX, g.moveY, zoneRectsRef.current);
        lastHover.current = null;
        cbs.current.setHoverZoneId(null);

        const settle = () => {
          setDragging(false);
          cbs.current.onDragStateChange(false);
        };

        Animated.parallel([
          Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.timing(lift, { toValue: 0, duration: 140, useNativeDriver: true }),
        ]).start();

        if (hit === pair.id) {
          // snap into the zone, then let the parent swap in the "matched" card
          settle();
          cbs.current.onCorrectMatch(pair.id);
          return;
        }

        if (hit !== null) cbs.current.onWrongAttempt(pair.id, hit);

        shakeX.setValue(0);
        Animated.sequence([
          Animated.timing(shakeX, { toValue: 9, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -9, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 5, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
        ]).start();

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) pan.setValue({ x: 0, y: 0 });
          settle();
          startWiggle();
        });
      },

      onPanResponderTerminate: () => {
        lastHover.current = null;
        cbs.current.setHoverZoneId(null);
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.timing(lift, { toValue: 0, duration: 140, useNativeDriver: true }),
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: true }),
        ]).start(() => {
          setDragging(false);
          cbs.current.onDragStateChange(false);
          startWiggle();
        });
      },
    })
  ).current;

  const rotate = Animated.add(
    wiggle.interpolate({ inputRange: [-1, 1], outputRange: [-0.05, 0.05] }),
    pan.x.interpolate({ inputRange: [-160, 0, 160], outputRange: [-0.12, 0, 0.12], extrapolate: 'clamp' })
  ).interpolate({ inputRange: [-1, 1], outputRange: ['-57deg', '57deg'] });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        s.dragChip,
        dragging && s.dragChipActive,
        {
          transform: [
            { translateX: Animated.add(pan.x, shakeX) },
            { translateY: Animated.add(pan.y, lift.interpolate({ inputRange: [0, 1], outputRange: [0, -6] })) },
            { rotate },
            { scale },
          ],
        },
      ]}
    >
      <LinearGradient colors={pair.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.dragChipGradient}>
        <View style={s.dragChipShine} />
        <View style={s.dragChipGrip}><GripIcon /></View>
        <Text style={s.dragChipEmoji}>{pair.emoji}</Text>
        <Text style={s.dragChipLetter}>{pair.letter}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

/* ══ Matched dock card (pops in) ═════════════════════════════════════ */
function MatchedDock() {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
      <LinearGradient colors={['#ECFDF5', '#D1FAE5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.dockSlotDone}>
        <CheckCircleIcon size={22} color="#10B981" />
        <Text style={s.dockDoneText}>Matched!</Text>
      </LinearGradient>
    </Animated.View>
  );
}

/* ══ Drop zone ════════════════════════════════════════════════════════ */
function DropZone({
  pair, state, onRef, onLayout,
}: {
  pair: typeof MATCH_PAIRS[number];
  state: 'idle' | 'hover' | 'wrong' | 'success' | 'matched';
  onRef: (node: View | null) => void;
  onLayout: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pulse, {
      toValue: state === 'hover' ? 1 : state === 'success' ? 1 : 0,
      friction: 6,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [state]);

  const palette = {
    idle: { bg: '#F8FAFC', border: '#E2E8F0', text: '#0f3172' },
    hover: { bg: pair.soft, border: pair.color[0], text: '#0f3172' },
    wrong: { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B' },
    success: { bg: '#D1FAE5', border: '#34D399', text: '#065F46' },
    matched: { bg: '#ECFDF5', border: '#6EE7B7', text: '#065F46' },
  }[state];

  return (
    <Animated.View
      ref={onRef as any}
      onLayout={onLayout}
      collapsable={false}
      style={[
        s.dropZone,
        { backgroundColor: palette.bg, borderColor: palette.border },
        state === 'hover' && s.dropZoneHover,
        { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] },
      ]}
    >
      {state === 'matched' && <Text style={s.dropZoneEmoji}>{pair.emoji}</Text>}
      {state === 'matched' && <CheckCircleIcon size={15} color="#10B981" />}
      <Text numberOfLines={2} style={[s.dropZoneText, { color: palette.text }]}>{pair.match}</Text>
      {state === 'hover' && <Text style={s.dropHint}>Drop here!</Text>}
    </Animated.View>
  );
}

/* ══ Matching Screen ══════════════════════════════════════════════════ */
function MatchingScreen({ onDone, onExit }: { onDone: (correct: number, mistakes: number) => void; onExit: () => void }) {
  const [showExit, setShowExit] = useState(false);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [hoverZoneId, setHoverZoneId] = useState<number | null>(null);
  const [wrongFlashZone, setWrongFlashZone] = useState<number | null>(null);
  const [successFlash, setSuccessFlash] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [burst, setBurst] = useState(0);

  const shuffledTargets = useMemo(() => shuffle(MATCH_PAIRS), []);
  const zoneRectsRef = useRef<Record<number, Rect>>({});
  const zoneNodeRefs = useRef<Record<number, View | null>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const measureZone = useCallback((id: number) => {
    const node = zoneNodeRefs.current[id];
    // @ts-ignore RN measureInWindow
    node?.measureInWindow?.((x: number, y: number, width: number, height: number) => {
      if (width > 0) zoneRectsRef.current[id] = { x, y, width, height };
    });
  }, []);

  const remeasureAll = useCallback(() => {
    MATCH_PAIRS.forEach(p => measureZone(p.id));
  }, [measureZone]);

  const handleCorrect = useCallback((id: number) => {
    setSuccessFlash(id);
    setBurst(b => b + 1);
    setMatchedIds(prev => new Set(prev).add(id));
    timers.current.push(setTimeout(() => setSuccessFlash(null), 500));
  }, []);

  const handleWrong = useCallback((_chipId: number, targetId: number) => {
    setMistakes(m => m + 1);
    setWrongFlashZone(targetId);
    timers.current.push(setTimeout(() => setWrongFlashZone(null), 450));
  }, []);

  const allMatched = matchedIds.size === MATCH_PAIRS.length;
  const progress = (matchedIds.size / MATCH_PAIRS.length) * 100;

  const encouragement = allMatched
    ? 'You did it! 🎉'
    : matchedIds.size === 0
      ? 'Drag a sign onto its meaning!'
      : `Great! ${MATCH_PAIRS.length - matchedIds.size} to go 💪`;

  return (
    <SafeAreaView style={s.container}>
      <ExitModal visible={showExit} onClose={() => setShowExit(false)} onConfirm={onExit} />

      {/* Hero Banner */}
      <View style={s.bannerWrapper}>
        <LinearGradient
          colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.bannerCard}
        >
          <DriftingCloud top={6} size={1.2} duration={20000} startX={0} opacity={0.15} variant={1} trackWidth={SCREEN_WIDTH - 32} />
          <DriftingCloud top={38} size={0.8} duration={16000} startX={SCREEN_WIDTH * 0.5} opacity={0.10} variant={3} trackWidth={SCREEN_WIDTH - 32} />

          <View style={s.bannerContent}>
            <View style={s.bannerLeft}>
              <View style={s.bannerSubtitleRow}>
                <TrophyIcon size={13} color="#fde68a" />
                <Text style={s.bannerSubtitle}>Drag & Drop Challenge</Text>
              </View>
              <Text style={s.bannerTitle}>Match the Signs</Text>
              <Text style={s.bannerDesc}>{encouragement}</Text>
            </View>
            <View style={s.bannerRight}>
              <View style={s.xpPill}>
                <StarIcon size={12} color="#F59E0B" />
                <Text style={s.xpPillText}>{matchedIds.size * 10} XP</Text>
              </View>
              <Pressable style={s.exitPill} onPress={() => setShowExit(true)} hitSlop={8}>
                <CloseIcon size={14} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={s.progressSection}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={s.progressTextRow}>
              <Text style={s.progressText}>{matchedIds.size} of {MATCH_PAIRS.length} matched</Text>
              <Text style={s.progressText}>{Math.round(progress)}%</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!dragging}
        scrollEventThrottle={16}
        onScroll={remeasureAll}
        onMomentumScrollEnd={remeasureAll}
        onContentSizeChange={remeasureAll}
      >
        <View style={s.matchArea}>
          {/* Signs */}
          <View style={s.leftCol}>
            <Text style={s.colLabel}>🖐️ Signs</Text>
            {MATCH_PAIRS.map(pair => (
              <View key={pair.id} style={[s.dockSlot, { borderColor: matchedIds.has(pair.id) ? '#A7F3D0' : '#E5E7F5' }]}>
                {matchedIds.has(pair.id) ? (
                  <MatchedDock />
                ) : (
                  <DraggableChip
                    pair={pair}
                    zoneRectsRef={zoneRectsRef}
                    onCorrectMatch={handleCorrect}
                    onWrongAttempt={handleWrong}
                    setHoverZoneId={setHoverZoneId}
                    onDragStateChange={setDragging}
                    remeasure={remeasureAll}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Meanings */}
          <View style={s.rightCol}>
            <Text style={s.colLabel}>🎯 Meanings</Text>
            {shuffledTargets.map(pair => {
              const state: 'idle' | 'hover' | 'wrong' | 'success' | 'matched' =
                matchedIds.has(pair.id) ? 'matched'
                  : successFlash === pair.id ? 'success'
                    : wrongFlashZone === pair.id ? 'wrong'
                      : hoverZoneId === pair.id ? 'hover'
                        : 'idle';
              return (
                <DropZone
                  key={pair.id}
                  pair={pair}
                  state={state}
                  onRef={node => { zoneNodeRefs.current[pair.id] = node; }}
                  onLayout={() => measureZone(pair.id)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Burst trigger={burst} />

      {allMatched && (
        <View style={s.continueSheet}>
          <LinearGradient colors={['#ECFDF5', '#D1FAE5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.continueGradient}>
            <View style={s.continueContent}>
              <Image source={require('../../assets/images/img/senya_teaching.png')} style={s.senyaSmall} contentFit="contain" />
              <View style={s.continueTextBlock}>
                <Text style={s.continueTitle}>All Matched! 🎉</Text>
                <Text style={s.continueSub}>
                  {mistakes === 0 ? "Perfect round! You're amazing!" : `${mistakes} mistake${mistakes > 1 ? 's' : ''} along the way.`}
                </Text>
              </View>
            </View>
            <Pressable style={s.continueBtn} onPress={() => onDone(MATCH_PAIRS.length, mistakes)}>
              <Text style={s.continueBtnText}>See Results →</Text>
            </Pressable>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ══ Result Screen ════════════════════════════════════════════════════ */
function ResultScreen({ mistakes, onRetry, onHome }: { mistakes: number; onRetry: () => void; onHome: () => void }) {
  const total = MATCH_PAIRS.length;
  const xpEarned = Math.max(total * 10 - mistakes * 3, total * 4);
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

  const result = mistakes === 0
    ? { label: 'Perfect Match! 🎉' }
    : mistakes <= 2
      ? { label: 'Nicely Done! ✨' }
      : { label: 'Round Complete! 💪' };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.resultScroll} showsVerticalScrollIndicator={false}>
        <View style={s.bannerWrapper}>
          <LinearGradient
            colors={['#0d326b', '#1e4b8f', '#1a6fd4']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bannerCard}
          >
            <DriftingCloud top={6} size={1.2} duration={20000} startX={0} opacity={0.15} variant={1} trackWidth={SCREEN_WIDTH - 32} />
            <DriftingCloud top={38} size={0.8} duration={16000} startX={SCREEN_WIDTH * 0.5} opacity={0.10} variant={3} trackWidth={SCREEN_WIDTH - 32} />

            <View style={s.resultBannerContent}>
              <View style={s.resultBannerLeft}>
                <View style={s.bannerSubtitleRow}>
                  <TrophyIcon size={13} color="#fde68a" />
                  <Text style={s.bannerSubtitle}>Quiz Complete!</Text>
                </View>
                <Text style={s.bannerTitle}>{result.label}</Text>
                <View style={s.resultStarsRow}>
                  {[1, 2, 3].map(i => <Text key={i} style={[s.resultStar, { opacity: i <= stars ? 1 : 0.2 }]}>⭐</Text>)}
                </View>
                <View style={s.resultScoreRow}>
                  <Text style={s.resultScoreNum}>{total}<Text style={s.resultScoreOf}>/{total}</Text></Text>
                  <Text style={s.resultScoreSub}>pairs matched · {mistakes} mistake{mistakes !== 1 ? 's' : ''}</Text>
                </View>
              </View>
              <View style={s.resultBannerRight}>
                <View style={s.resultXpBadge}>
                  <SparkleIcon size={16} color="#FDE68A" />
                  <Text style={s.resultXpText}>+{xpEarned} XP</Text>
                </View>
                <Image source={require('../../assets/images/img/senya_teaching.png')} style={s.resultSenya} contentFit="contain" />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={s.recapSection}>
          <View style={s.recapHeader}>
            <View style={s.recapIconBox}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f3172" strokeWidth="2">
                <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </Svg>
              <Text style={s.recapTitle}>What You Learned</Text>
            </View>
          </View>

          {MATCH_PAIRS.map(pair => (
            <View key={pair.id} style={s.recapItem}>
              <View style={[s.recapEmojiBox, { backgroundColor: pair.soft }]}>
                <Text style={s.recapEmoji}>{pair.emoji}</Text>
              </View>
              <View style={s.recapTextBlock}>
                <Text style={s.recapLetter}>{pair.letter}</Text>
                <Text style={s.recapFact}>{pair.fact}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.resultActions}>
          <Pressable style={s.primaryBtn} onPress={onRetry}>
            <LinearGradient colors={['#2563EB', '#1D4ED8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryBtnGradient}>
              <Text style={s.primaryBtnText}>↺ Try Again</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={s.ghostBtn} onPress={onHome}>
            <Text style={s.ghostBtnText}>🏠 Back to Dashboard</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ══ MAIN ═════════════════════════════════════════════════════════════ */
export default function QuizDnD() {
  const router = useRouter();
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz');
  const [finalMistakes, setFinalMistakes] = useState(0);
  const [roundKey, setRoundKey] = useState(0);

  const handleExit = () => router.push('/(tabs)/dashboard');
  const handleDone = (_correct: number, mistakes: number) => {
    setFinalMistakes(mistakes);
    setPhase('result');
  };

  if (phase === 'quiz') return <MatchingScreen key={roundKey} onDone={handleDone} onExit={handleExit} />;
  return (
    <ResultScreen
      mistakes={finalMistakes}
      onRetry={() => { setPhase('quiz'); setFinalMistakes(0); setRoundKey(k => k + 1); }}
      onHome={handleExit}
    />
  );
}

/* ══ STYLES ═══════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 160 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  exitModal: { width: '88%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 28, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.18, shadowRadius: 48, elevation: 24 },
  exitIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  exitTitle: { fontSize: 20, fontWeight: '800', color: '#0f3172', marginBottom: 8 },
  exitDesc: { fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 20, marginBottom: 24, textAlign: 'center' },
  exitBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  stayBtn: { flex: 1, paddingVertical: 13, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 40, alignItems: 'center' },
  stayText: { fontSize: 14, fontWeight: '700', color: '#0f3172' },
  exitConfirmBtn: { flex: 1.3, paddingVertical: 13, backgroundColor: '#DC2626', borderRadius: 40, alignItems: 'center' },
  exitConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  bannerWrapper: { paddingHorizontal: 16, marginBottom: 14 },
  bannerCard: { borderRadius: 24, padding: 18, overflow: 'hidden', shadowColor: '#0d326b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 6 },
  bannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bannerLeft: { flex: 1, zIndex: 2 },
  bannerSubtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  bannerSubtitle: { fontSize: 11, fontWeight: '800', color: '#fde68a', textTransform: 'uppercase', letterSpacing: 0.6 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2 },
  bannerDesc: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  bannerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 2 },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  xpPillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  exitPill: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },

  progressSection: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  progressTrack: { backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 12, height: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FCD34D', borderRadius: 12 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  matchArea: { flexDirection: 'row', gap: 14, paddingHorizontal: 16 },
  leftCol: { flex: 1, gap: 12 },
  rightCol: { flex: 1.3, gap: 12 },
  colLabel: { fontSize: 12, fontWeight: '800', color: '#0f3172', letterSpacing: 0.4, marginBottom: 2 },

  dockSlot: { height: 80, borderRadius: 20, borderWidth: 2, borderColor: '#E5E7F5', borderStyle: 'dashed', backgroundColor: '#FBFAFF', alignItems: 'center', justifyContent: 'center' },
  dockSlotDone: { width: '100%', height: '100%', borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  dockDoneText: { fontSize: 11, fontWeight: '800', color: '#065F46' },

  dragChip: { width: '92%', height: '90%', borderRadius: 18, overflow: 'hidden', shadowColor: '#0f3172', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8, zIndex: 20 },
  dragChipActive: { shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 24, zIndex: 999 },
  dragChipGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 },
  dragChipShine: { position: 'absolute', top: -18, left: -10, right: 18, height: 42, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.20)' },
  dragChipGrip: { position: 'absolute', top: 5, right: 7 },
  dragChipEmoji: { fontSize: 26 },
  dragChipLetter: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.4, marginTop: 2 },

  dropZone: { minHeight: 80, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, gap: 3 },
  dropZoneHover: { shadowColor: '#0f3172', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 8, borderStyle: 'dashed' },
  dropZoneEmoji: { fontSize: 18 },
  dropZoneText: { fontSize: 11.5, fontWeight: '700', textAlign: 'center', lineHeight: 15 },
  dropHint: { fontSize: 9.5, fontWeight: '800', color: '#0f3172', opacity: 0.6, letterSpacing: 0.4 },

  burstLayer: { position: 'absolute', top: '45%', left: '50%', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' },

  continueSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 20 },
  continueGradient: { borderRadius: 24, padding: 16, shadowColor: '#0f3172', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12 },
  continueContent: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  senyaSmall: { width: 48, height: 48 },
  continueTextBlock: { flex: 1 },
  continueTitle: { fontSize: 16, fontWeight: '800', color: '#065F46' },
  continueSub: { fontSize: 12, color: '#047857', fontWeight: '600' },
  continueBtn: { backgroundColor: '#10B981', borderRadius: 60, paddingVertical: 14, alignItems: 'center' },
  continueBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  resultScroll: { paddingBottom: 40 },
  resultBannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultBannerLeft: { flex: 1, zIndex: 2 },
  resultStarsRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  resultStar: { fontSize: 22 },
  resultScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  resultScoreNum: { fontSize: 32, fontWeight: '900', color: '#fff' },
  resultScoreOf: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  resultScoreSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  resultBannerRight: { alignItems: 'center', zIndex: 2 },
  resultXpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, marginBottom: 6 },
  resultXpText: { fontSize: 12, fontWeight: '700', color: '#FDE68A' },
  resultSenya: { width: 64, height: 64 },

  recapSection: { paddingHorizontal: 16, marginTop: 4 },
  recapHeader: { marginBottom: 12 },
  recapIconBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recapTitle: { fontSize: 16, fontWeight: '800', color: '#0f3172' },
  recapItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 16, padding: 12, marginBottom: 8 },
  recapEmojiBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recapEmoji: { fontSize: 20 },
  recapTextBlock: { flex: 1 },
  recapLetter: { fontSize: 12, fontWeight: '800', color: '#0f3172', marginBottom: 1 },
  recapFact: { fontSize: 11.5, color: '#6B7280', fontWeight: '500', lineHeight: 16 },

  resultActions: { paddingHorizontal: 16, marginTop: 8, gap: 12 },
  primaryBtn: { borderRadius: 60, overflow: 'hidden', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 10 },
  primaryBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ghostBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 60, paddingVertical: 16, alignItems: 'center' },
  ghostBtnText: { fontSize: 15, fontWeight: '700', color: '#0f3172' },
});
