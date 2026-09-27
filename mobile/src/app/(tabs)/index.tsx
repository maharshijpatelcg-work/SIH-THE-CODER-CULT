import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  getAppTheme,
  AppThemeColors,
} from '../../constants/theme';
import { useUserStore, usePlacesStore, useChatStore } from '../../stores';
import { useTranslation } from '../../hooks/useTranslation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Place } from '../../stores';
import { placesApi } from '../../services/api';
import { useLocation } from '../../hooks/useLocation';
import { CategoryFilter } from '../../components/CategoryFilter';
import { WeatherCrowdBar } from '../../components/WeatherCrowdBar';
import { SafetySOSModal } from '../../components/SafetySOSModal';
import {
  PlaceCardHorizontalSkeleton,
  PlaceCardVerticalSkeleton,
  LocationBadgeSkeleton,
} from '../../components/Skeleton';
import { useSpeech } from '../../hooks/useSpeech';
import { ALL_SEED_PLACES } from '../../utils/seedPlaces';
import { dynamicImageService } from '../../services/dynamicImageService';
import { haversineDistance } from '../../utils/routeService';
import { ScalePressable, PulseBeacon } from '../../components/common/MicroAnimations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPOTLIGHT_CARD_WIDTH = Math.min(SCREEN_WIDTH - 44, 340);
const RELIC_CARD_WIDTH = 260;

const ICONIC_SPOTLIGHT_IDS = [
  'IND-HER-26', // Kumbhalgarh Fort
  'IND-HER-11', // Rani Ki Vav
  'IND-HER-31', // Sun Temple Modhera
  'IND-GJ-SOU', // Statue of Unity
  'IND-GJ-08',  // Somnath Mahadev
  'IND-HER-13', // Dholavira: Indus Metropolis
  'IND-HER-27', // Chittorgarh Fort
  'IND-HER-01', // Taj Mahal
  'IND-HER-10', // Hampi
  'IND-HER-02', // Qutub Minar
];

interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  era: string;
  imageUrl: string;
  audioNarration: string;
  aiPrompt: string;
  badge: string;
  place: Place;
}

interface SpotlightCardProps {
  item: SpotlightItem;
  isPlayingThis: boolean;
  theme: AppThemeColors;
  onPress: () => void;
  onAudioToggle: () => void;
  onAskAi: () => void;
  onExplore: () => void;
  cardWidth: number;
}

function SpotlightCard({
  item,
  isPlayingThis,
  theme,
  onPress,
  onAudioToggle,
  onAskAi,
  onExplore,
  cardWidth,
}: SpotlightCardProps) {
  const resolvedInitial = dynamicImageService.getPlaceImage(
    item.place?.name || item.title,
    item.place?.category,
    item.place?.imageUrl || item.imageUrl
  );
  const [imgUrl, setImgUrl] = useState<string>(resolvedInitial);

  useEffect(() => {
    let cancelled = false;
    const resolved = dynamicImageService.getPlaceImage(
      item.place?.name || item.title,
      item.place?.category,
      item.place?.imageUrl || item.imageUrl
    );
    setImgUrl(resolved);

    if (resolved && (resolved.includes('wikimedia.org') || resolved.includes('wikipedia.org'))) {
      return;
    }

    const searchName = item.place?.name || item.title;
    dynamicImageService.fetchPlaceImageAsync(searchName).then((wikiUrl) => {
      if (!cancelled && wikiUrl) setImgUrl(wikiUrl);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [item.id, item.imageUrl, item.place?.name, item.place?.imageUrl]);

  return (
    <View style={[styles.spotlightCard, { width: cardWidth }]}>
      <TouchableOpacity
        activeOpacity={0.92}
        style={StyleSheet.absoluteFill}
        onPress={onPress}
      >
        <ExpoImage
          source={{ uri: imgUrl }}
          style={styles.spotlightImage}
          contentFit="cover"
          transition={400}
          onError={() => {
            if (item.place?.imageUrl && item.place.imageUrl !== imgUrl) {
              setImgUrl(item.place.imageUrl);
            } else {
              const fallback = dynamicImageService.getArchitecturalFallback(item.place?.name || item.title, item.place?.category, 0);
              setImgUrl(fallback);
            }
          }}
        />
        <View style={styles.spotlightScrim} />
      </TouchableOpacity>

      {/* Top Badges */}
      <View style={styles.spotlightTopRow} pointerEvents="box-none">
        <View style={styles.spotlightBadge}>
          <MaterialIcons name="verified" size={14} color="#C59B51" />
          <Text style={styles.spotlightBadgeText}>{item.badge}</Text>
        </View>
        <ScalePressable
          style={[styles.audioPlayBtn, isPlayingThis && styles.audioPlayBtnActive]}
          onPress={onAudioToggle}
          minScale={0.9}
        >
          <MaterialIcons
            name={isPlayingThis ? 'stop' : 'graphic-eq'}
            size={14}
            color={isPlayingThis ? '#FFFFFF' : '#FFB4A1'}
          />
          <Text style={[styles.audioPlayBtnText, isPlayingThis && styles.audioPlayBtnTextActive]}>
            {isPlayingThis ? 'Stop' : 'Listen (2m)'}
          </Text>
        </ScalePressable>
      </View>

      {/* Bottom Content Area */}
      <View style={styles.spotlightContent} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
          <Text style={styles.spotlightTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text style={styles.spotlightMeta} numberOfLines={1}>
            {item.era} • {item.location} • <Text style={{ color: '#FFD081', fontWeight: '700' }}>★ 4.9 (1.4k)</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.spotlightActions}>
          <ScalePressable
            style={[styles.spotlightExploreBtn, { backgroundColor: theme.isDark ? theme.primary : '#9A442D' }]}
            onPress={onExplore}
            minScale={0.95}
          >
            <Text style={styles.spotlightExploreBtnText}>Explore Site</Text>
            <MaterialIcons name="arrow-forward" size={15} color="#FFFFFF" />
          </ScalePressable>

          <ScalePressable
            style={styles.spotlightCuratorBtn}
            onPress={onAskAi}
            minScale={0.95}
          >
            <MaterialIcons name="auto-awesome" size={16} color={theme.isDark ? '#D4AF7C' : '#9A442D'} />
            <Text style={[styles.spotlightCuratorBtnText, { color: theme.isDark ? '#F5F1E8' : '#1B1C1A' }]}>
              Curator
            </Text>
          </ScalePressable>
        </View>
      </View>
    </View>
  );
}

// ── Horizontal Relic Card (Dribbble 1:1 Reference) ──
interface NearbyRelicCardProps {
  place: Place;
  theme: AppThemeColors;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onPress: () => void;
  onRoute: () => void;
}

function NearbyRelicCard({
  place,
  theme,
  isFavorite,
  onFavoriteToggle,
  onPress,
  onRoute,
}: NearbyRelicCardProps) {
  const [imgUrl, setImgUrl] = useState<string>(() =>
    dynamicImageService.getPlaceImage(place.name, place.category, place.imageUrl)
  );

  useEffect(() => {
    let cancelled = false;
    const resolved = dynamicImageService.getPlaceImage(place.name, place.category, place.imageUrl);
    setImgUrl(resolved);

    if (resolved && (resolved.includes('wikimedia.org') || resolved.includes('wikipedia.org'))) {
      return;
    }

    dynamicImageService.fetchPlaceImageAsync(place.name).then((wikiUrl) => {
      if (!cancelled && wikiUrl) setImgUrl(wikiUrl);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [place.name, place.imageUrl, place.category]);

  const hr = (place as any).heritageRecord || {};
  const eraText = hr.period || (place.category === 'temple' ? 'Ancient Era' : 'Historic Site');
  const catLabel = (hr.significance ? hr.significance.split(' ')[0] : place.category || 'SANCTUARY').toUpperCase();
  const driveMinutes = Math.max(5, Math.round((place.distance || 2.4) * 3));
  const feeText = (place as any).entryFee ? `₹${(place as any).entryFee}` : '₹40';

  return (
    <View
      style={[
        styles.relicCard,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0.25 : 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
      ]}
    >
      {/* Photo with Era badge & Bookmark */}
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.relicImgWrap}>
        <ExpoImage
          source={{ uri: imgUrl }}
          style={styles.relicImage}
          contentFit="cover"
          transition={250}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          onError={() => setImgUrl(dynamicImageService.getArchitecturalFallback(place.name, place.category, 0))}
        />
        <View style={styles.relicEraBadge}>
          <Text style={styles.relicEraText}>{eraText}</Text>
        </View>
        <TouchableOpacity
          style={styles.relicBookmarkBtn}
          onPress={onFavoriteToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons
            name={isFavorite ? 'bookmark' : 'bookmark-border'}
            size={17}
            color={theme.isDark ? theme.primary : '#9A442D'}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Info Body */}
      <View style={styles.relicBody}>
        <View>
          <View style={styles.relicTopRow}>
            <Text style={[styles.relicCatText, { color: theme.isDark ? theme.primary : '#9A442D' }]}>
              {catLabel}
            </Text>
            <Text style={[styles.relicRatingText, { color: theme.secondary }]}>
              ★ {place.rating ? place.rating.toFixed(1) : '4.8'}
            </Text>
          </View>
          <Text style={[styles.relicTitle, { color: theme.text }]} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={styles.relicDistRow}>
            <MaterialIcons name="near-me" size={13} color={theme.isDark ? theme.primary : '#9A442D'} />
            <Text style={[styles.relicDistText, { color: theme.textMuted }]} numberOfLines={1}>
              {place.distance !== undefined ? `${place.distance} km away` : 'Nearby'} · {driveMinutes} min drive
            </Text>
          </View>
        </View>

        {/* Pricing & Directions */}
        <View style={styles.relicFooter}>
          <Text style={[styles.relicPrice, { color: theme.text }]}>
            {feeText} <Text style={[styles.relicPriceSub, { color: theme.textMuted }]}>/ pass</Text>
          </Text>
          <TouchableOpacity
            style={[styles.relicDirectionsBtn, { backgroundColor: theme.surfaceHighlight }]}
            onPress={onRoute}
            activeOpacity={0.8}
          >
            <Text style={[styles.relicDirectionsText, { color: theme.text }]}>Directions</Text>
            <MaterialIcons name="turn-right" size={14} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name, language, themeMode } = useUserStore();
  const theme = getAppTheme(themeMode);
  const { t } = useTranslation();
  const { places, setPlaces, favorites, toggleFavorite, isLoading } = usePlacesStore();
  const { setContext } = useChatStore();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(places.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [sosVisible, setSosVisible] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  const { speak, stop, isSpeaking } = useSpeech();

  // Clear the active card highlight when narration finishes naturally
  useEffect(() => {
    if (!isSpeaking) {
      setActiveAudioId(null);
    }
  }, [isSpeaking]);

  const hasWarmedCacheRef = useRef(false);
  const isScreenLoading = (places.length === 0 && (initialLoading || isLoading)) || refreshing;

  const latKey = (location.latitude || 22.30).toFixed(2);
  const lonKey = (location.longitude || 73.18).toFixed(2);

  const allCatalogPlaces = useMemo(() => {
    const userLat = location.latitude ?? 22.3072;
    const userLng = location.longitude ?? 73.1812;

    const map = new Map<string, Place>();
    for (const p of ALL_SEED_PLACES) map.set(p.id, p);
    for (const p of places) map.set(p.id, p);

    const merged = Array.from(map.values()).map((p) => {
      const dist = haversineDistance(userLat, userLng, p.latitude, p.longitude);
      return {
        ...p,
        distance: Number(dist.toFixed(1)),
      };
    });

    merged.sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999));
    return merged;
  }, [places, location.latitude, location.longitude]);

  const fetchPlaces = async () => {
    try {
      const response: any = await placesApi.getNearby(
        location.latitude || 22.3072,
        location.longitude || 73.1812,
        50
      );
      const list = Array.isArray(response) ? response : (response?.data || []);
      if (list && list.length > 0) {
        setPlaces(list);
      } else {
        const allRes: any = await placesApi.getAll();
        const allList = Array.isArray(allRes) ? allRes : (allRes?.data || []);
        if (allList.length > 0) {
          setPlaces(allList);
        }
      }
    } catch (error) {
      console.warn('[HomeScreen] Live fetch notice, keeping cached places:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (places.length === 0) {
        setInitialLoading(true);
      }
      await fetchPlaces();
      if (mounted) {
        setInitialLoading(false);
      }
      if (!hasWarmedCacheRef.current) {
        const namesToWarm = [...new Set(
          [...(places.length > 0 ? places : []), ...allCatalogPlaces.slice(0, 20)]
            .slice(0, 20)
            .map((p) => p.name)
            .filter(Boolean)
        )];
        if (namesToWarm.length > 0) {
          hasWarmedCacheRef.current = true;
          dynamicImageService.warmCache(namesToWarm).catch(() => {});
        }
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [latKey, lonKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlaces();
    setRefreshing(false);
  };

  const handleQuickAction = (key: string) => {
    switch (key) {
      case 'explore':
        router.push('/(tabs)/explore');
        break;
      case 'ai':
        setContext(null, null);
        router.push('/(tabs)/ai');
        break;
      case 'camera':
        router.push('/camera');
        break;
      case 'plan':
        router.push('/(tabs)/plan');
        break;
    }
  };

  const handlePlacePress = (place: Place) => {
    router.push(`/place/${place.id}`);
  };

  const handleToggleAudio = (id: string, text: string) => {
    if (isSpeaking && activeAudioId === id) {
      stop();
      setActiveAudioId(null);
    } else {
      setActiveAudioId(id);
      speak(text, language);
    }
  };

  const handleSpotlightAskAi = (item: { id: string; title: string; aiPrompt: string }) => {
    setContext(item.id, item.title);
    router.push({
      pathname: '/(tabs)/ai',
      params: {
        autoAsk: item.aiPrompt,
        placeId: item.id,
        placeName: item.title,
        t: String(Date.now()),
      },
    });
  };

  const spotlightMonuments = useMemo(() => {
    const matched: Place[] = [];
    for (const tid of ICONIC_SPOTLIGHT_IDS) {
      const p = allCatalogPlaces.find((item) => item.id === tid || item.id?.toLowerCase() === tid.toLowerCase());
      if (p) matched.push(p);
    }
    if (matched.length < 5) {
      for (const p of allCatalogPlaces) {
        if (!matched.some((m) => m.id === p.id)) {
          matched.push(p);
          if (matched.length >= 7) break;
        }
      }
    }

    return matched.map((p) => {
      const hr = (p as any).heritageRecord || {};
      const title = (language === 'hi' && (p as any).nameHi)
        ? (p as any).nameHi
        : (language === 'gu' && (p as any).nameGu)
        ? (p as any).nameGu
        : p.name;
      const cityOrDistrict = (p as any).city || (p as any).district || '';
      const state = (p as any).state || '';
      const locationStr = [cityOrDistrict, state].filter(Boolean).join(', ') || 'India';
      const era = hr.period || 'Historical Era';
      const audioNarration = hr.shortStory || p.shortDescription || `${title} is a celebrated heritage monument of India.`;
      const aiPrompt = `Tell me the history, architecture, and significance of ${p.name}.`;
      const badge = hr.significance?.includes('UNESCO')
        ? 'UNESCO Nominee'
        : (p.rating && p.rating >= 4.8)
        ? 'Top Rated'
        : 'Heritage Wonder';
      const imageUrl = dynamicImageService.getPlaceImage(p.name, p.category, p.imageUrl);

      return {
        id: p.id,
        title,
        subtitle: p.shortDescription || hr.significance || title,
        location: locationStr,
        era,
        imageUrl,
        audioNarration,
        aiPrompt,
        badge,
        place: p,
      };
    });
  }, [allCatalogPlaces, language]);

  const filteredPlaces = allCatalogPlaces.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesName =
      p.name?.toLowerCase().includes(q) ||
      (p as any).nameHi?.toLowerCase().includes(q) ||
      (p as any).nameGu?.toLowerCase().includes(q);
    const matchesDesc = (p.shortDescription || '').toLowerCase().includes(q);
    const matchesCity =
      (p as any).city?.toLowerCase().includes(q) ||
      (p as any).state?.toLowerCase().includes(q);
    const matchesTags =
      Array.isArray((p as any).tags) &&
      (p as any).tags.some((t: string) => t.toLowerCase().includes(q));
    return matchesName || matchesDesc || matchesCity || matchesTags;
  });

  const getTimeMeta = () => {
    const hour = new Date().getHours();
    let text = 'Good Evening';
    let icon: keyof typeof MaterialIcons.glyphMap = 'nights-stay';
    let emoji = '🌙';

    if (language === 'hi') {
      if (hour < 12) { text = 'शुभ प्रभात'; icon = 'wb-twilight'; emoji = '☀️'; }
      else if (hour < 17) { text = 'शुभ दोपहर'; icon = 'wb-sunny'; emoji = '☀️'; }
      else { text = 'शुभ संध्या'; icon = 'nights-stay'; emoji = '🌙'; }
    } else if (language === 'gu') {
      if (hour < 12) { text = 'શુભ સવાર'; icon = 'wb-twilight'; emoji = '☀️'; }
      else if (hour < 17) { text = 'શુભ બપોર'; icon = 'wb-sunny'; emoji = '☀️'; }
      else { text = 'શુભ સાંજ'; icon = 'nights-stay'; emoji = '🌙'; }
    } else {
      if (hour < 12) { text = 'Good Morning'; icon = 'wb-twilight'; emoji = '☀️'; }
      else if (hour < 17) { text = 'Good Afternoon'; icon = 'wb-sunny'; emoji = '☀️'; }
      else { text = 'Good Evening'; icon = 'nights-stay'; emoji = '🌙'; }
    }

    return { text, icon, emoji };
  };

  const timeMeta = getTimeMeta();

  const quickActionsList = [
    {
      key: 'explore',
      label: 'Explore Map',
      icon: 'explore',
      bgLight: '#D2E5F5',
      iconLight: '#1F313D',
      bgDark: '#1E2D3B',
      iconDark: '#7BADD4',
    },
    {
      key: 'ai',
      label: 'Ask AI',
      icon: 'auto-awesome',
      bgLight: '#FFDBD2',
      iconLight: '#9A442D',
      bgDark: '#3B221B',
      iconDark: '#FFB4A1',
    },
    {
      key: 'camera',
      label: 'Scan Lens',
      icon: 'document-scanner',
      bgLight: '#FFDEAA',
      iconLight: '#7A5814',
      bgDark: '#362B16',
      iconDark: '#EDBF71',
    },
    {
      key: 'plan',
      label: 'Plan Tour',
      icon: 'calendar-month',
      bgLight: '#EAE8E5',
      iconLight: '#55423E',
      bgDark: '#26262B',
      iconDark: '#C7C5C2',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 95, 115) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* User Status Header (Dribbble 1:1) */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 20) }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={[styles.headerAvatarWrap, { borderColor: theme.isDark ? theme.primary : '#C59B51' }]}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.85}
            >
              <ExpoImage
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80' }}
                style={styles.headerAvatar}
                contentFit="cover"
              />
            </TouchableOpacity>

            <View style={styles.headerTextWrap}>
              <Text style={[styles.eyebrowLabel, { color: theme.textMuted }]} numberOfLines={1}>
                EXPLORE · UNDERSTAND · BELONG
              </Text>
              <Text style={[styles.greetingTitle, { color: theme.text }]} numberOfLines={1}>
                {timeMeta.text}, {name || 'Explorer'} {timeMeta.emoji}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {isScreenLoading ? (
              <LocationBadgeSkeleton />
            ) : (
              <ScalePressable
                style={[styles.locationBadge, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                onPress={() => router.push('/(tabs)/explore')}
                minScale={0.94}
              >
                <PulseBeacon color="#10B981" size={6} glowSize={12} />
                <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {location.city || 'Vadodara'}
                </Text>
              </ScalePressable>
            )}

            <ScalePressable
              style={styles.sosBadge}
              onPress={() => setSosVisible(true)}
              minScale={0.92}
            >
              <MaterialIcons name="emergency" size={14} color="#FFFFFF" />
              <Text style={styles.sosBadgeText}>SOS</Text>
            </ScalePressable>
          </View>
        </View>

        {/* Search & Discovery Capsule */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: theme.isDark ? 0.2 : 0.05,
                shadowRadius: 8,
                elevation: 2,
              },
            ]}
          >
            <MaterialIcons name="search" size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search 155+ heritage sites, stepwells..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="cancel" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/explore')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.searchTuneBtn,
                  { backgroundColor: theme.isDark ? '#26262B' : '#1B1C1A' },
                ]}
              >
                <MaterialIcons name="tune" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Live Search Results Section */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.searchResultsSection}>
            <View style={[styles.searchActiveBadge, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <MaterialIcons name="filter-list" size={16} color={theme.primary} />
              <Text style={[styles.searchActiveText, { color: theme.text }]}>
                Found {filteredPlaces.length} site{filteredPlaces.length === 1 ? '' : 's'} matching "{searchQuery}"
              </Text>
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={[styles.clearSearchText, { color: theme.primary }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            {filteredPlaces.length === 0 ? (
              <View style={styles.searchEmptyContainer}>
                <MaterialIcons name="search-off" size={44} color={theme.textMuted} />
                <Text style={[styles.searchEmptyTitle, { color: theme.text }]}>No monuments found</Text>
                <Text style={[styles.searchEmptySub, { color: theme.textMuted }]}>
                  Try searching for forts, stepwells, temples, or cities like 'Patan', 'Somnath', or 'Kumbhalgarh'.
                </Text>
              </View>
            ) : (
              <View style={styles.searchResultsList}>
                {filteredPlaces.slice(0, 15).map((place) => {
                  const placeImg = dynamicImageService.getPlaceImage(
                    place.name,
                    place.category,
                    place.imageUrl
                  );
                  return (
                    <TouchableOpacity
                      key={place.id}
                      style={[styles.searchResultCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                      onPress={() => router.push(`/place/${place.id}`)}
                      activeOpacity={0.75}
                    >
                      <ExpoImage
                        source={{ uri: placeImg }}
                        style={styles.searchResultThumb}
                        contentFit="cover"
                        transition={200}
                        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                      />
                      <View style={styles.searchResultInfo}>
                        <View style={styles.searchResultHeaderRow}>
                          <Text style={[styles.searchResultName, { color: theme.text }]} numberOfLines={1}>
                            {place.name}
                          </Text>
                          <View style={[styles.searchResultCatBadge, { backgroundColor: theme.badge }]}>
                            <Text style={[styles.searchResultCatText, { color: theme.primary }]}>
                              {(place.category || 'site').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.searchResultDesc, { color: theme.textMuted }]} numberOfLines={2}>
                          {place.shortDescription || 'Historic Indian architectural wonder.'}
                        </Text>
                        <View style={styles.searchResultFooter}>
                          <Text style={[styles.searchResultMeta, { color: theme.textMuted }]}>
                            📍 {(place as any).city || (place as any).state || 'India'} {place.distance !== undefined ? `• ${place.distance} km` : ''}
                          </Text>
                          <TouchableOpacity
                            style={[styles.searchResultRouteBtn, { backgroundColor: theme.surfaceHighlight }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push({
                                pathname: '/(tabs)/explore',
                                params: {
                                  destinationId: place.id,
                                  destinationName: place.name,
                                  routeTo: 'true',
                                },
                              });
                            }}
                          >
                            <MaterialIcons name="directions" size={14} color={theme.primary} />
                            <Text style={[styles.searchResultRouteBtnText, { color: theme.primary }]}>Route</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Environmental & Crowd Radar Strip */}
        <WeatherCrowdBar
          latitude={location.latitude || 22.3072}
          longitude={location.longitude || 73.1812}
          isLoading={isScreenLoading}
        />

        {/* Tourist Wallet & Forex Quick-Strip (Dribbble 1:1) */}
        <ScalePressable
          style={[
            styles.forexBanner,
            {
              backgroundColor: theme.isDark ? '#231B12' : '#FFF3E0',
              borderColor: theme.isDark ? 'rgba(212, 175, 124, 0.25)' : '#FFE0B2',
            },
          ]}
          onPress={() => router.push('/settings/wallet' as any)}
          minScale={0.98}
        >
          <View style={styles.forexLeft}>
            <View style={[styles.forexIconWrap, { backgroundColor: theme.isDark ? '#3D2F1B' : '#FFD081' }]}>
              <MaterialIcons name="currency-exchange" size={19} color={theme.isDark ? '#D4AF7C' : '#795712'} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.forexTitle, { color: theme.text }]} numberOfLines={1}>
                Tourist Forex & UPI One World
              </Text>
              <Text style={[styles.forexSubtitle, { color: theme.isDark ? theme.primary : '#7A5814' }]}>
                Zero-markup conversion active
              </Text>
            </View>
          </View>
          <View style={[styles.forexArrowBtn, { backgroundColor: theme.surfaceElevated }]}>
            <MaterialIcons name="arrow-forward" size={15} color={theme.text} />
          </View>
        </ScalePressable>

        {/* Quick Action Grid (4 squircle tiles) */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsGrid}>
            {quickActionsList.map((action) => (
              <ScalePressable
                key={action.key}
                style={[
                  styles.quickActionTile,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: theme.isDark ? 0.2 : 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                  },
                ]}
                onPress={() => handleQuickAction(action.key)}
                minScale={0.94}
              >
                <View
                  style={[
                    styles.quickActionIconBox,
                    { backgroundColor: theme.isDark ? action.bgDark : action.bgLight },
                  ]}
                >
                  <MaterialIcons
                    name={action.icon as any}
                    size={22}
                    color={theme.isDark ? action.iconDark : action.iconLight}
                  />
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.text }]} numberOfLines={1}>
                  {action.label}
                </Text>
              </ScalePressable>
            ))}
          </View>
        </View>

        {/* Featured Spotlight Carousel ("Must-Visit Wonders") */}
        {!searchQuery && (
          <View style={styles.spotlightSection}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  <Text style={{ fontStyle: 'italic', fontFamily: Typography.fontFamily.serif }}>Must-Visit</Text> Wonders
                </Text>
              </View>
              <View style={[styles.audioHintPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <MaterialIcons name="headphones" size={14} color={theme.primary} />
                <Text style={[styles.audioHintText, { color: theme.text }]}>Audio Guides</Text>
              </View>
            </View>

            <FlatList
              data={spotlightMonuments}
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingTop: 4, paddingBottom: 10 }}
              renderItem={({ item }) => {
                const isPlayingThis = isSpeaking && activeAudioId === item.id;
                return (
                  <SpotlightCard
                    key={item.id}
                    item={item}
                    isPlayingThis={isPlayingThis}
                    theme={theme}
                    cardWidth={SPOTLIGHT_CARD_WIDTH}
                    onPress={() => router.push(`/place/${item.id}`)}
                    onAudioToggle={() => handleToggleAudio(item.id, item.audioNarration)}
                    onAskAi={() => handleSpotlightAskAi(item)}
                    onExplore={() => router.push({
                      pathname: '/(tabs)/explore',
                      params: { destinationId: item.id, destinationName: item.title, routeTo: 'true' },
                    })}
                  />
                );
              }}
            />
          </View>
        )}

        {/* Cultural Mystery & Story Card (Dribbble 1:1) */}
        {!searchQuery && (
          <View style={styles.mysteryCardContainer}>
            <View style={[styles.mysteryCard, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border }]}>
              <View style={styles.mysteryWatermark} pointerEvents="none">
                <MaterialIcons
                  name="temple-hindu"
                  size={96}
                  color={theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}
                />
              </View>
              <View style={styles.mysteryContent}>
                <View style={styles.mysteryBadgeRow}>
                  <MaterialIcons name="lightbulb" size={15} color={theme.primary} />
                  <Text style={[styles.mysteryBadgeText, { color: theme.primary }]}>CULTURAL MYSTERY</Text>
                </View>
                <Text style={[styles.mysteryTitle, { color: theme.text }]}>
                  The Inverted Sanctuaries of Gujarat
                </Text>
                <Text style={[styles.mysteryBody, { color: theme.textSecondary }]}>
                  Centuries ago, stepwells (Vavs) inverted sacred temple geometry downward toward life-giving aquifers, transforming water reservoirs into carved subterranean sanctuaries.
                </Text>
                <TouchableOpacity
                  style={styles.mysteryActionBtn}
                  onPress={() => {
                    setContext(null, 'Stepwell Architecture');
                    router.push({
                      pathname: '/(tabs)/ai',
                      params: {
                        autoAsk: 'Explain the sacred geometry, folklore, and engineering of stepwells (Vavs) in Gujarat.',
                      },
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.mysteryActionText, { color: theme.primary }]}>
                    Unravel subterranean engineering
                  </Text>
                  <MaterialIcons name="east" size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Nearby Relics (Nearby Heritage Monuments - Dribbble 1:1) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={[styles.sectionTitle, { color: theme.text }]} numberOfLines={1}>
                Nearby Relics
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
                Sorted by proximity
              </Text>
            </View>
            <Text style={[styles.sectionCount, { color: theme.textMuted }]}>
              {filteredPlaces.length} places
            </Text>
          </View>

          {/* Category Filter Chips */}
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

          {/* Horizontal Heritage Cards */}
          {isScreenLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              <PlaceCardHorizontalSkeleton />
              <PlaceCardHorizontalSkeleton />
              <PlaceCardHorizontalSkeleton />
            </ScrollView>
          ) : filteredPlaces.length > 0 ? (
            <FlatList
              data={filteredPlaces.slice(0, 10)}
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingTop: 4, paddingBottom: 10 }}
              renderItem={({ item }) => (
                <NearbyRelicCard
                  key={item.id}
                  place={item}
                  theme={theme}
                  isFavorite={favorites.includes(item.id)}
                  onFavoriteToggle={() => toggleFavorite(item.id)}
                  onPress={() => handlePlacePress(item)}
                  onRoute={() => {
                    router.push({
                      pathname: '/(tabs)/explore',
                      params: {
                        destinationId: item.id,
                        destinationName: item.name,
                        routeTo: 'true',
                      },
                    });
                  }}
                />
              )}
            />
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="search-off" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('home.noPlacesFound')}
              </Text>
              {(selectedCategory || searchQuery.length > 0) && (
                <TouchableOpacity
                  style={[styles.emptyClearBtn, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.emptyClearText}>
                    {selectedCategory ? 'Show all categories' : 'Clear search filter'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Living Crafts & Artisans Banner */}
        {!searchQuery && (
          <View style={styles.craftsBannerContainer}>
            <View style={[styles.craftsBanner, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border }]}>
              <View style={styles.craftsContent}>
                <View style={[styles.craftsBadge, { backgroundColor: theme.isDark ? 'rgba(212, 175, 124, 0.2)' : 'rgba(154, 68, 45, 0.12)' }]}>
                  <MaterialIcons name="palette" size={14} color={theme.primary} />
                  <Text style={[styles.craftsBadgeText, { color: theme.primary }]}>LIVING CRAFTS</Text>
                </View>
                <Text style={[styles.craftsTitle, { color: theme.text }]}>Patan Patola & Rogan Art</Text>
                <Text style={[styles.craftsDesc, { color: theme.textSecondary }]}>
                  Centuries-old double ikat weaving and castor seed art preserved by master craftsmen of Gujarat.
                </Text>
                <TouchableOpacity
                  style={styles.craftsBtn}
                  onPress={() => {
                    setContext(null, 'Artisans & Handicrafts');
                    router.push({
                      pathname: '/(tabs)/ai',
                      params: {
                        autoAsk: 'Tell me about the master artisans of Patola Silk in Patan and Rogan Art in Nirona, Kutch.',
                      },
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.craftsBtnText, { color: theme.primary }]}>Discover Master Crafts →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Geo-Fenced Safety & SOS Emergency Modal */}
      <SafetySOSModal
        visible={sosVisible}
        onClose={() => setSosVisible(false)}
        latitude={location.latitude || 22.3072}
        longitude={location.longitude || 73.1812}
        currentLocationName={`${location.city || 'Gujarat'}, ${location.region || 'India'}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 115,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Spacing.md,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  headerAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 1.5,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  headerTextWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  eyebrowLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  greetingTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  headerRight: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#BA1A1A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    shadowColor: '#BA1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sosBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    height: '100%',
  },
  searchTuneBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search results
  searchResultsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  searchActiveText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  searchEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  searchEmptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  searchResultsList: {
    gap: 10,
  },
  searchResultCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    gap: 12,
  },
  searchResultThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  searchResultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  searchResultCatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  searchResultCatText: {
    fontSize: 9,
    fontWeight: '800',
  },
  searchResultDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  searchResultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultMeta: {
    fontSize: 11,
  },
  searchResultRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  searchResultRouteBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Tourist Forex Banner
  forexBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  forexLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  forexIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forexTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  forexSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  forexArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Quick Action Grid (4 squircle tiles)
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickActionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Spotlight Hero Section
  spotlightSection: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  audioHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  audioHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  spotlightCard: {
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#1E1E1E',
  },
  spotlightImage: {
    ...StyleSheet.absoluteFill,
  },
  spotlightScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 15, 15, 0.45)',
  },
  spotlightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  spotlightBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1B1C1A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  audioPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(27, 28, 26, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: BorderRadius.full,
  },
  audioPlayBtnActive: {
    backgroundColor: '#BA1A1A',
  },
  audioPlayBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  audioPlayBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  spotlightContent: {
    zIndex: 10,
    gap: 10,
  },
  spotlightTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  spotlightMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  spotlightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  spotlightExploreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 12,
  },
  spotlightExploreBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  spotlightCuratorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },
  spotlightCuratorBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Cultural Mystery Card
  mysteryCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  mysteryCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mysteryWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -15,
  },
  mysteryContent: {
    zIndex: 1,
    gap: 6,
  },
  mysteryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mysteryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mysteryTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontStyle: 'italic',
    fontSize: 18,
    fontWeight: '700',
  },
  mysteryBody: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  mysteryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  mysteryActionText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Nearby Relics Section
  section: {
    marginBottom: 20,
  },
  relicCard: {
    width: RELIC_CARD_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  relicImgWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  relicImage: {
    width: '100%',
    height: '100%',
  },
  relicEraBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(27, 28, 26, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  relicEraText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  relicBookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relicBody: {
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  relicTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  relicCatText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  relicRatingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  relicTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  relicDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relicDistText: {
    fontSize: 11,
  },
  relicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  relicPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  relicPriceSub: {
    fontSize: 10.5,
    fontWeight: '400',
  },
  relicDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  relicDirectionsText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Crafts Banner
  craftsBannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  craftsBanner: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  craftsContent: {
    gap: 6,
  },
  craftsBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  craftsBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  craftsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  craftsDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  craftsBtn: {
    marginTop: 2,
  },
  craftsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  emptyClearBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  emptyClearText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
