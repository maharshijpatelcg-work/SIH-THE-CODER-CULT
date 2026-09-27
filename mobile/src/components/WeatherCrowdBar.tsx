import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, getAppTheme } from '../constants/theme';
import { useUserStore } from '../stores';
import { getLiveWeather, getLiveCrowd, WeatherInfo, CrowdInfo } from '../utils/touristMeta';
import { WeatherCrowdBarSkeleton } from './Skeleton';

interface WeatherCrowdBarProps {
  latitude?: number;
  longitude?: number;
  placeName?: string;
  variant?: 'compact' | 'full';
  isLoading?: boolean;
}

export function WeatherCrowdBar({
  latitude = 22.3072,
  longitude = 73.1812,
  placeName,
  variant = 'compact',
  isLoading = false,
}: WeatherCrowdBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo>(() => getLiveWeather(latitude, longitude));

  // Live real-time weather from Open-Meteo (free, zero API key, exact coordinates)
  React.useEffect(() => {
    let isMounted = true;
    async function fetchLiveWeather() {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&current_weather=true`,
          { signal: controller.signal }
        );
        clearTimeout(tid);
        if (!res.ok) return;
        const data = await res.json();
        const cur = data?.current_weather;
        if (!cur || !isMounted) return;

        const temp = Math.round(cur.temperature);
        const code = Number(cur.weathercode);
        let condition = 'Clear Sky';
        let icon = 'wb-sunny';

        if (code === 0) {
          condition = cur.is_day ? 'Clear & Sunny' : 'Clear Night';
          icon = cur.is_day ? 'wb-sunny' : 'nights-stay';
        } else if (code <= 3) {
          condition = 'Partly Cloudy';
          icon = 'cloud-queue';
        } else if (code <= 48) {
          condition = 'Misty / Fog';
          icon = 'cloud';
        } else if (code <= 67 || (code >= 80 && code <= 82)) {
          condition = 'Rain Showers';
          icon = 'grain';
        } else if (code >= 95) {
          condition = 'Thunderstorm';
          icon = 'thunderstorm';
        } else {
          condition = 'Pleasant';
          icon = 'wb-sunny';
        }

        // Recompute the fallback for the current lat/lng so humidity/advisory are fresh
        const freshFallback = getLiveWeather(latitude, longitude);
        if (isMounted) {
          setWeather({
            temp,
            condition,
            icon,
            humidity: freshFallback.humidity,
            advisory: freshFallback.advisory,
          });
        }
      } catch {
        // Retain fresh calculated fallback for current coordinates
        if (isMounted) setWeather(getLiveWeather(latitude, longitude));
      }
    }
    // Reset to fresh location-aware fallback immediately when coordinates change
    setWeather(getLiveWeather(latitude, longitude));
    fetchLiveWeather();
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  if (isLoading) {
    return <WeatherCrowdBarSkeleton variant={variant} />;
  }

  const crowd: CrowdInfo = getLiveCrowd(placeName);
  const isMonumentView = Boolean(placeName);
  const themeMode = useUserStore((s) => s.themeMode);
  const themeColors = getAppTheme(themeMode);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variant === 'full' && styles.containerFull,
        {
          backgroundColor: themeColors.surfaceElevated,
          borderColor: themeColors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: themeColors.isDark ? 0.2 : 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.88}
    >
      <View style={styles.row}>
        <View style={styles.metricItem}>
          <View style={[styles.iconCircle, { backgroundColor: themeColors.isDark ? 'rgba(212, 175, 124, 0.15)' : 'rgba(224, 122, 95, 0.12)' }]}>
            <MaterialIcons name={weather.icon as any} size={16} color={themeColors.primary} />
          </View>
          <View style={styles.metricTextWrap}>
            <Text style={[styles.metricValue, { color: themeColors.text }]} numberOfLines={1}>{weather.temp}°C</Text>
            <Text style={[styles.metricLabel, { color: themeColors.textMuted }]} numberOfLines={1}>{weather.condition}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

        {/* Crowd Level Chip */}
        <View style={styles.metricItem}>
          <View style={[styles.crowdDot, { backgroundColor: crowd.color }]} />
          <View style={styles.metricTextWrap}>
            <View style={styles.crowdHeader}>
              <Text style={[styles.metricValue, { color: themeColors.isDark ? themeColors.text : themeColors.secondary }]} numberOfLines={1}>
                {isMonumentView ? `${crowd.level} Crowd` : '24% Crowd Density'}
              </Text>
            </View>
            <Text style={[styles.metricLabel, { color: themeColors.textMuted }]} numberOfLines={1}>
              {isMonumentView ? `~${crowd.waitTimeMins}m wait time` : 'Optimal visiting window'}
            </Text>
          </View>
        </View>

        <MaterialIcons
          name={expanded ? 'expand-less' : 'info-outline'}
          size={18}
          color={themeColors.textMuted}
          style={styles.infoIcon}
        />
      </View>

      {/* Expanded Advisory Details */}
      {expanded && (
        <View style={styles.advisoryBox}>
          <View style={styles.advisoryRow}>
            <MaterialIcons name="lightbulb-outline" size={15} color={Colors.primary} />
            <Text style={styles.advisoryText}>{weather.advisory}</Text>
          </View>
          <View style={styles.advisoryRow}>
            <MaterialIcons name="groups" size={15} color={crowd.color} />
            <Text style={styles.advisoryText}>
              {isMonumentView
                ? crowd.description
                : `Current visitor flow across regional monuments is ${(crowd.level || 'moderate').toLowerCase()}. Recommended visiting window: 8:00 AM – 11:30 AM and 4:30 PM – 6:30 PM.`}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 124, 0.2)',
    marginHorizontal: 20,
    marginBottom: Spacing.md,
  },
  containerFull: {
    marginHorizontal: 0,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricTextWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 124, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  metricLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexShrink: 0,
  },
  crowdDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  crowdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginLeft: 4,
    flexShrink: 0,
  },
  advisoryBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  advisoryText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
