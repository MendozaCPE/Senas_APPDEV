// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUBBLE_SIZE = 50;

// ── Thin outline icons — matches the reference's line-icon style ──────
function HomeIcon({ color = '#1A1A2E' }: { color?: string }) {
  return (
    <Svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11.5L12 4l9 7.5" />
      <Path d="M5.5 10v9a1 1 0 0 0 1 1H9v-6h6v6h2.5a1 1 0 0 0 1-1v-9" />
    </Svg>
  );
}
function BookIcon({ color = '#1A1A2E' }: { color?: string }) {
  return (
    <Svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 5.5C4 4.67 4.67 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13z" />
      <Path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H12v16h6.5c.83 0 1.5-.67 1.5-1.5v-13z" />
    </Svg>
  );
}
function HandIcon({ color = '#1A1A2E' }: { color?: string }) {
  return (
    <Svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 12.5V5a1.3 1.3 0 0 1 2.6 0v6" />
      <Path d="M11.6 11V4.2a1.3 1.3 0 0 1 2.6 0V11" />
      <Path d="M14.2 11.3V6a1.3 1.3 0 0 1 2.6 0v8.5" />
      <Path d="M16.8 12v2.5c0 3.04-2.46 5.5-5.5 5.5h-1a5.5 5.5 0 0 1-4.6-2.48L4 13.8c-.5-.75-.3-1.76.44-2.26.68-.46 1.58-.32 2.1.3L8 13.8" />
    </Svg>
  );
}
function CompassIcon({ color = '#1A1A2E' }: { color?: string }) {
  return (
    <Svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Path d="M15 9l-2 6-4 2 2-6 4-2z" />
    </Svg>
  );
}
function UserIcon({ color = '#1A1A2E' }: { color?: string }) {
  return (
    <Svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8" r="3.6" />
      <Path d="M5 20c0-3.31 3.13-6 7-6s7 2.69 7 6" />
    </Svg>
  );
}

const TAB_CONFIG = [
  { name: 'dashboard', label: 'Home', Icon: HomeIcon },
  { name: 'lessons', label: 'Learn', Icon: BookIcon },
  { name: 'gesture', label: 'Practice', Icon: HandIcon },
  { name: 'achievements', label: 'Badges', Icon: CompassIcon },
  { name: 'profile', label: 'Me', Icon: UserIcon },
];

// ── Custom tab bar — anchored flush to the bottom edge, bubble pops above it ──
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const tabWidth = SCREEN_WIDTH / state.routes.length;
  const bubbleX = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(bubbleX, {
      toValue: state.index * tabWidth,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.barWrap}>
      {/* Floating bubble that pops above the active tab */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            left: 0,
            transform: [
              { translateX: Animated.add(bubbleX, tabWidth / 2 - BUBBLE_SIZE / 2) },
            ],
          },
        ]}
      >
        {(() => {
          const config = TAB_CONFIG[state.index];
          if (!config) return null;
          const Icon = config.Icon;
          return <Icon color="#0f3172" />;
        })()}
      </Animated.View>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {state.routes.map((route: any, index: number) => {
          const config = TAB_CONFIG.find(t => t.name === route.name) || TAB_CONFIG[index];
          const isFocused = state.index === index;
          const Icon = config.Icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
              {/* reserve icon space; the real icon shows in the floating bubble when active */}
              <View style={styles.tabIconSlot}>
                {!isFocused && <Icon color="#9AA1B0" />}
              </View>
              <Text
                numberOfLines={1}
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="lessons" options={{ title: 'Learn' }} />
      <Tabs.Screen name="gesture" options={{ title: 'Practice' }} />
      <Tabs.Screen name="achievements" options={{ title: 'Badges' }} />
      <Tabs.Screen name="profile" options={{ title: 'Me' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Anchored flush to the bottom of the screen — no floating margin
  barWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },

  bar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 68,
    alignItems: 'center',
    paddingTop: 8,
    shadowColor: '#0f3172',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 10,
  },

  tabItem: {
    width: SCREEN_WIDTH / 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
  },

  tabIconSlot: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#9AA1B0',
  },
  tabLabelActive: {
    fontWeight: '800',
    color: '#0f3172',
  },

  // The floating bubble that pops above the bar for the active tab
  bubble: {
    position: 'absolute',
    top: -22,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#0f3172',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f3172',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
});