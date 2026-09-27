import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, getAppTheme } from '../constants/theme';
import { useUserStore } from '../stores';
import type { Tabs } from 'expo-router';

export type CustomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

interface TabItemConfig {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  isCenter?: boolean;
}

const TAB_CONFIG: Record<string, TabItemConfig> = {
  index: { icon: 'home', label: 'Home' },
  explore: { icon: 'explore', label: 'Explore' },
  ai: { icon: 'auto-awesome', label: 'AI Guide', isCenter: true },
  plan: { icon: 'route', label: 'Plan' },
  profile: { icon: 'person', label: 'Profile' },
};

// ── Tab Item Props ──
interface TabButtonProps {
  config: TabItemConfig;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

// ── 1. Standard Tab Button with Crisp Micro-Spring & Subtle Levitation ──
function StandardTabButton({ config, label, isFocused, onPress, onLongPress }: TabButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(isFocused ? -2 : 0)).current;
  const themeMode = useUserStore((s) => s.themeMode);
  const themeColors = getAppTheme(themeMode);

  // Smooth elevation shift when tab selection changes
  useEffect(() => {
    Animated.spring(translateYAnim, {
      toValue: isFocused ? -2 : 0,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 8,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const activeCapsuleBg = themeColors.isDark
    ? 'rgba(212, 175, 124, 0.12)'
    : 'rgba(154, 68, 45, 0.08)';

  return (
    <Pressable
      style={styles.tabPressable}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.tabCapsule,
          isFocused && { backgroundColor: activeCapsuleBg },
          {
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim },
            ],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={config.icon}
            size={22}
            color={isFocused ? themeColors.primary : themeColors.textMuted}
          />
          {isFocused && (
            <View style={[styles.activeIndicatorPip, { backgroundColor: themeColors.primary }]} />
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            isFocused
              ? [styles.tabLabelActive, { color: themeColors.primary }]
              : [styles.tabLabelInactive, { color: themeColors.textMuted }],
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ── 2. Center "Yatra AI" Button with Controlled Luxury Aura & Snappy Feedback ──
function CenterAiButton({ config, isFocused, onPress, onLongPress }: TabButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const themeMode = useUserStore((s) => s.themeMode);
  const themeColors = getAppTheme(themeMode);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 8,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const centerBg = isFocused
    ? themeColors.primary
    : themeColors.isDark
    ? '#1C1C28'
    : '#F5ECE6';

  const centerTextColor = isFocused
    ? '#FFFFFF'
    : themeColors.primary;

  return (
    <Pressable
      style={styles.centerPressable}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel="AI Guide"
    >
      <Animated.View
        style={[
          styles.aiPillContainer,
          {
            backgroundColor: centerBg,
            borderColor: themeColors.primary,
          },
          isFocused && styles.aiPillContainerActive,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Subtle Luxury Accent Ring */}
        <View
          pointerEvents="none"
          style={[
            styles.aiGlowHalo,
            {
              borderColor: themeColors.primary,
              opacity: isFocused ? 0.9 : 0.35,
            },
          ]}
        />

        <MaterialIcons
          name={config.icon}
          size={20}
          color={centerTextColor}
        />
        <Text
          style={[
            styles.aiPillText,
            { color: centerTextColor },
            isFocused && styles.aiPillTextActive,
          ]}
          numberOfLines={1}
        >
          AI Guide
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ── 3. Bottom Docked Navigation Bar ──
export function AnimatedBottomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 8);
  const themeMode = useUserStore((s) => s.themeMode);
  const themeColors = getAppTheme(themeMode);

  return (
    <View
      style={[
        styles.dockedBarContainer,
        {
          backgroundColor: themeColors.isDark
            ? 'rgba(13, 13, 18, 0.98)'
            : 'rgba(251, 249, 246, 0.97)',
          borderTopColor: themeColors.border,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={styles.tabBarInner}>
        {state.routes.map((route: { key: string; name: string }, index: number) => {
          const descriptor = descriptors[route.key];
          const options = descriptor?.options || {};
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            icon: 'circle' as any,
            label: route.name,
          };
          const label = options.title !== undefined ? options.title : config.label;

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const handleLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (config.isCenter) {
            return (
              <CenterAiButton
                key={route.key}
                config={config}
                label={label}
                isFocused={isFocused}
                onPress={handlePress}
                onLongPress={handleLongPress}
              />
            );
          }

          return (
            <StandardTabButton
              key={route.key}
              config={config}
              label={label}
              isFocused={isFocused}
              onPress={handlePress}
              onLongPress={handleLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Docked to device bottom — grounded, stable, elegant
  dockedBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 13, 18, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 9999,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    paddingHorizontal: 6,
  },

  // Standard Tab Button
  tabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabCapsule: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    gap: 2,
    minWidth: 50,
  },
  tabCapsuleActive: {
    backgroundColor: 'rgba(212, 175, 124, 0.10)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 24,
  },
  activeIndicatorPip: {
    position: 'absolute',
    bottom: -3,
    width: 12,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Center Yatra AI Button
  centerPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  aiPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: '#1C1C28',
    borderWidth: 1.2,
    borderColor: 'rgba(212, 175, 124, 0.35)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  aiPillContainerActive: {
    backgroundColor: Colors.primary,
    borderColor: '#FFFFFF',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  aiGlowHalo: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 124, 0.45)',
  },
  aiPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  aiPillTextActive: {
    color: '#0A0A0E',
    fontWeight: '900',
  },
});
