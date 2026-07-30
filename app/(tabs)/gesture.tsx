// app/(tabs)/gesture.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { api } from '../../services/api';

// ── Icons ──────────────────────────────────────────────────────────────
function LockIcon({ size = 18, color = '#94A3B8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Rect x="3" y="11" width="18" height="11" rx="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}
function CheckIcon({ size = 18, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6 9 17 4 12" />
    </Svg>
  );
}

// ── Module card — pastel background, big image, "Choose" pill (per reference) ──
function ModuleCard({ module, onPress }: { module: any; onPress: () => void }) {
  const isLocked = module.locked;
  const isCompleted = module.isCompleted;
  const progress = module.progress || 0;
  const [colorA] = module.color || ['#2563EB', '#3B82F6'];

  return (
    <Pressable
      onPress={onPress}
      disabled={isLocked}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: isLocked ? '#F1F5F9' : `${colorA}30`, opacity: pressed ? 0.94 : 1 },
      ]}
    >
      {/* decorative bubbles — kiddie background motif */}
      {!isLocked && (
        <>
          <View style={[styles.bubble, { width: 90, height: 90, top: -30, right: 30, backgroundColor: `${colorA}22` }]} />
          <View style={[styles.bubble, { width: 50, height: 50, top: 60, right: -14, backgroundColor: `${colorA}2E` }]} />
          <View style={[styles.bubble, { width: 34, height: 34, bottom: 54, right: 90, backgroundColor: `${colorA}20` }]} />
          <View style={[styles.bubble, { width: 22, height: 22, top: 20, left: '58%', backgroundColor: '#ffffff55' }]} />
          <View style={[styles.bubble, { width: 130, height: 130, bottom: -55, left: -40, backgroundColor: `${colorA}18` }]} />
        </>
      )}

      {/* top-right corner badge */}
      <View style={[styles.cornerBadge, { backgroundColor: isLocked ? '#E2E8F0' : '#fff' }]}>
        {isLocked ? (
          <LockIcon size={15} color="#94A3B8" />
        ) : isCompleted ? (
          <CheckIcon size={15} color="#10B981" />
        ) : (
          <>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.cornerBadgeText}>{module.xp}</Text>
          </>
        )}
      </View>

      {/* text block, top-left */}
      <View style={styles.cardTextBlock}>
        <Text style={[styles.cardCategoryLabel, { color: isLocked ? '#94A3B8' : colorA }]} numberOfLines={1}>
          {module.categoryLabel?.toUpperCase()}
        </Text>
        <Text numberOfLines={2} style={[styles.cardTitle, isLocked && styles.cardTitleLocked]}>
          {module.display_name || module.title}
        </Text>
        <Text numberOfLines={2} style={styles.cardSubtitle}>
          {isLocked ? 'Complete the previous module to unlock' : `${module.lessons} signs to learn · ${progress}% done`}
        </Text>
      </View>

      {/* pill button, bottom-left */}
      <View style={styles.cardBottomRow}>
        <View style={[styles.chooseBtn, isLocked && styles.chooseBtnLocked]}>
          <Text style={[styles.chooseBtnText, isLocked && styles.chooseBtnTextLocked]}>
            {isLocked ? 'Locked' : isCompleted ? 'Review' : 'Start'}
          </Text>
        </View>
      </View>

      {/* big illustration, bottom-right, fills the card */}
      <View style={styles.cardIllustrationWrap} pointerEvents="none">
        {module.image && (
          <Image
            source={module.image}
            style={[styles.cardIllustration, isLocked && { opacity: 0.4 }]}
            contentFit="contain"
          />
        )}
      </View>
    </Pressable>
  );
}

// ── Pill filter row (matches "All / New / Coloring / Art & Craft") ────
function PillFilter({ categories, active, onChange }: {
  categories: { id: string; title: string; icon: string }[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillScroll}
      style={styles.pillScrollOuter}
    >
      {categories.map((cat) => {
        const isActive = active === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onChange(cat.id)}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={isActive ? '#fff' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text numberOfLines={1} style={[styles.pillText, isActive && styles.pillTextActive]}>{cat.title}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Default Modules ────────────────────────────────────────────────────
const DEFAULT_MODULES = [
  {
    id: 'alphabet_part1', title: 'Alphabet Part 1', display_name: 'Alphabet Part 1 (A-M)',
    category: 'alphabet', categoryLabel: 'Alphabet', color: ['#2563EB', '#3B82F6'] as const,
    description: 'Learn letters A through M', progress: 0, xp: 40, locked: false,
    route: '/gesture/webview-camera', image: require('../../assets/images/img/alphabet.png'),
    lessons: 13, isCompleted: false,
  },
  {
    id: 'alphabet_part2', title: 'Alphabet Part 2', display_name: 'Alphabet Part 2 (N-Z)',
    category: 'alphabet', categoryLabel: 'Alphabet', color: ['#8B5CF6', '#A78BFA'] as const,
    description: 'Learn letters N through Z', progress: 0, xp: 40, locked: false,
    route: '/gesture/alphabet2', image: require('../../assets/images/img/alphabet_star.png'),
    lessons: 13, isCompleted: false,
  },
  {
    id: 'fingerspelling', title: 'Fingerspelling', display_name: 'Fingerspelling',
    category: 'practice', categoryLabel: 'Practice', color: ['#10B981', '#34D399'] as const,
    description: 'Spell words using signs', progress: 0, xp: 40, locked: true,
    route: '/gesture/fingerspelling', image: require('../../assets/images/img/senya_magnify.png'),
    lessons: 10, isCompleted: false,
  },
  {
    id: 'greetings', title: 'Basic Greetings', display_name: 'Basic Greetings',
    category: 'greetings', categoryLabel: 'Greetings', color: ['#EC4899', '#F472B6'] as const,
    description: 'Learn greetings and phrases', progress: 0, xp: 40, locked: false,
    route: '/gesture/webview-greetings', image: require('../../assets/images/img/greetings.png'),
    lessons: 5, isCompleted: false,
  },
  {
    id: 'numbers', title: 'Numbers 1-10', display_name: 'Numbers 1-10',
    category: 'numbers', categoryLabel: 'Numbers', color: ['#F59E0B', '#FBBF24'] as const,
    description: 'Learn numbers 1 through 10', progress: 0, xp: 30, locked: false,
    route: '/gesture/numbers', image: require('../../assets/images/img/numbers.png'),
    lessons: 10, isCompleted: false,
  },
];

const CATEGORIES = [
  { id: 'all', title: 'All', icon: 'apps-outline' },
  { id: 'alphabet', title: 'Alphabet', icon: 'text-outline' },
  { id: 'greetings', title: 'Greetings', icon: 'chatbubbles-outline' },
  { id: 'practice', title: 'Practice', icon: 'hand-left-outline' },
  { id: 'numbers', title: 'Numbers', icon: 'calculator-outline' },
];

export default function GestureMain() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGestureProgress = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.getGestureProgress();
      if (response && response.success) {
        setTotalXp(response.student?.total_xp || 0);

        const updatedModules = DEFAULT_MODULES.map(defaultModule => {
          const apiModule = response.modules?.find((m: any) => m.name === defaultModule.id);
          if (apiModule) {
            return {
              ...defaultModule,
              progress: apiModule.progress || 0,
              isCompleted: apiModule.is_completed || false,
              locked: apiModule.is_locked || false,
              xp: apiModule.xp_available || defaultModule.xp,
              description: apiModule.description || defaultModule.description,
              display_name: apiModule.display_name || defaultModule.display_name,
            };
          }
          return defaultModule;
        });

        setModules(updatedModules);
      }
    } catch (error) {
      console.error('Error fetching gesture progress:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGestureProgress();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGestureProgress();
  };

  const handleModulePress = (module: any) => {
    if (module.locked) return;
    router.push(module.route as any);
  };

  const filteredModules = selectedCategory === 'all'
    ? modules
    : modules.filter((m) => m.category === selectedCategory);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar — matches dashboard.tsx / lessons.tsx style */}
      <View style={styles.topBar}>
        <Text style={styles.logoText}>SEÑAS</Text>
        <View style={styles.topBarRight}>
          <View style={styles.xpTopBadge}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.xpTopBadgeText}>{totalXp}</Text>
          </View>
        </View>
      </View>

      {/* Pill filters */}
      <PillFilter categories={CATEGORIES} active={selectedCategory} onChange={setSelectedCategory} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredModules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No modules found</Text>
            <Text style={styles.emptySubtext}>Try a different category</Text>
          </View>
        ) : (
          filteredModules.map((m) => (
            <ModuleCard key={m.id} module={m} onPress={() => handleModulePress(m)} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 14, fontSize: 14, fontWeight: '600', color: '#64748B' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 8 : 16, paddingBottom: 10,
  },
  logoText: { color: '#0f3172', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpTopBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
  },
  xpTopBadgeText: { fontSize: 12.5, fontWeight: '800', color: '#92400E' },

  // Pill filters
  pillScrollOuter: { flexGrow: 0 },
  pillScroll: { paddingHorizontal: 20, paddingVertical: 8, gap: 10, paddingBottom: 22 },
  pill: {
    flexDirection: 'row', alignItems: 'center', flexShrink: 0,
    minHeight: 50,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#EEF2F7',
    shadowColor: '#0f3172', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  pillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 4,
  },
  pillText: { fontSize: 13, fontWeight: '700', color: '#64748B', lineHeight: 22, textAlignVertical: 'center' },
  pillTextActive: { color: '#fff' },

  scrollContent: { paddingHorizontal: 20 },

  // Card — pastel background, near-square, image filling bottom-right (per reference)
  card: {
    width: '100%',
    aspectRatio: 1.05,
    borderRadius: 26,
    marginBottom: 18,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },

  cornerBadge: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20,
    shadowColor: '#0f3172', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  cornerBadgeText: { fontSize: 11.5, fontWeight: '800', color: '#92400E' },

  bubble: {
    position: 'absolute',
    borderRadius: 999,
  },

  cardTextBlock: { maxWidth: '62%' },
  cardCategoryLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#0f3172', marginBottom: 6, lineHeight: 23 },
  cardTitleLocked: { color: '#94A3B8' },
  cardSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500', lineHeight: 17 },

  cardBottomRow: { position: 'absolute', left: 18, bottom: 18 },
  chooseBtn: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 10, paddingHorizontal: 20,
    shadowColor: '#0f3172', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
  },
  chooseBtnLocked: { backgroundColor: '#E2E8F0' },
  chooseBtnText: { fontSize: 13, fontWeight: '800', color: '#0f3172' },
  chooseBtnTextLocked: { color: '#94A3B8' },

  cardIllustrationWrap: {
    position: 'absolute', right: -10, bottom: -10,
    width: '58%', height: '68%',
    alignItems: 'flex-end', justifyContent: 'flex-end',
  },
  cardIllustration: { width: '100%', height: '100%' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f3172', marginTop: 12 },
  emptySubtext: { fontSize: 12.5, color: '#94A3B8', marginTop: 4 },
});