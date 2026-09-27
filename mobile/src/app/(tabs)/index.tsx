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
import { LinearGradient } from 'expo-linear-gradient';
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
const HERO_CARD_WIDTH = Math.min(SCREEN_WIDTH - 36, 360);
const RELIC_CARD_WIDTH = 250;

const STORY_HIGHLIGHTS = [
  {
    id: 'story-1',
    title: 'Jaipur Gems',
    sub: 'Pink City',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=300&q=80',
    colors: ['#F59E0B', '#EF4444'] as [string, string],
    category: 'palace',
  },
  {
    id: 'story-2',
    title: 'Agra Tales',
    sub: 'Taj Mahal',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=300&q=80',
    colors: ['#06B6D4', '#3B82F6'] as [string, string],
    category: 'heritage',
  },
  {
    id: 'story-3',
    title: 'Mughal Art',
    sub: 'Architecture',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=80',
    colors: ['#F59E0B', '#10B981'] as [string, string],
    category: 'culture',
  },
  {
    id: 'story-4',
    title: 'Hampi Ruins',
    sub: 'Vijayanagara',
    image: 'https://images.unsplash.com/photo-1600100397608-f010f4439c7a?w=300&q=80',
    colors: ['#8B5CF6', '#EC4899'] as [string, string],
    category: 'fort',
  },
  {
    id: 'story-5',
    title: 'Patan Vavs',
    sub: 'Stepwells',
    image: 'https://images.unsplash.com/photo-1622396481304-4b53e8424269?w=300&q=80',
    colors: ['#EC4899', '#F43F5E'] as [string, string],
    category: 'stepwell',
  },
];

// ── Horizontal Relic Card ──
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
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme.isDark ? 0.3 : 0.06,
          shadowRadius: 10,
          elevation: 3,
        },
      ]}
    >
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
            color={theme.isDark ? theme.primary : '#E11D48'}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.relicBody}>
        <View>
          <View style={styles.relicTopRow}>
            <Text style={[styles.relicCatText, { color: theme.isDark ? theme.primary : '#0D9488' }]}>
              {catLabel}
            </Text>
            <Text style={[styles.relicRatingText, { color: '#F59E0B' }]}>
              ★ {place.rating ? place.rating.toFixed(1) : '4.8'}
            </Text>
          </View>
          <Text style={[styles.relicTitle, { color: theme.text }]} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={styles.relicDistRow}>
            <MaterialIcons name="near-me" size={13} color={theme.isDark ? theme.primary : '#0D9488'} />
            <Text style={[styles.relicDistText, { color: theme.textMuted }]} numberOfLines={1}>
              {place.distance !== undefined ? `${place.distance} km away` : 'Nearby'} · {driveMinutes} min drive
            </Text>
          </View>
        </View>

        <View style={styles.relicFooter}>
          <Text style={[styles.relicPrice, { color: theme.text }]}>
            {feeText} <Text style={[styles.relicPriceSub, { color: theme.textMuted }]}>/ pass</Text>
          </Text>
          <TouchableOpacity
            style={[styles.relicDirectionsBtn, { backgroundColor: theme.isDark ? '#222' : '#0D9488' }]}
            onPress={onRoute}
            activeOpacity={0.8}
          >
            <Text style={styles.relicDirectionsText}>Directions</Text>
            <MaterialIcons name="turn-right" size={14} color="#FFFFFF" />
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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const { speak, stop, isSpeaking } = useSpeech();

  useEffect(() => {
    setIsAudioPlaying(isSpeaking);
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

  const handlePlacePress = (place: Place) => {
    router.push(`/place/${place.id}`);
  };

  const toggleHeroAudio = () => {
    if (isAudioPlaying) {
      stop();
      setIsAudioPlaying(false);
    } else {
      speak(
        'Welcome to Laxmi Vilas Palace, Vadodara. Built in 1890 CE by Maharaja Sayajirao Gaekwad III, it is four times the size of Buckingham Palace.',
        language
      );
      setIsAudioPlaying(true);
    }
  };

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 2.5D Architectural Dome Top Cutout Backdrop */}
      <View style={styles.domeBackdropContainer} pointerEvents="none">
        <ExpoImage
          source={{ uri: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=900&q=80' }}
          style={styles.domeBackdropImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={
            theme.isDark
              ? ['rgba(15,15,20,0.2)', 'rgba(15,15,20,0.75)', theme.background]
              : ['rgba(255,235,215,0.15)', 'rgba(251,249,246,0.85)', theme.background]
          }
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 95, 115) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header & Status Cockpit */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 20) }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.avatarGlowRing}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                style={styles.avatarGradientBorder}
              >
                <ExpoImage
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' }}
                  style={styles.headerAvatar}
                  contentFit="cover"
                />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerTextWrap}>
              <Text style={[styles.userLabelSmall, { color: theme.textMuted }]}>Name</Text>
              <Text style={[styles.userNameSmall, { color: theme.text }]}>{name || 'Explorer'}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <ScalePressable
              style={[styles.locationPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              onPress={() => router.push('/(tabs)/explore')}
              minScale={0.94}
            >
              <PulseBeacon color="#10B981" size={7} glowSize={12} />
              <Text style={[styles.locationPillText, { color: theme.text }]}>
                {location.city || 'Vadodara'}, India
              </Text>
            </ScalePressable>

            <ScalePressable
              style={styles.sosPill}
              onPress={() => setSosVisible(true)}
              minScale={0.92}
            >
              <MaterialIcons name="notifications-active" size={13} color="#E11D48" />
              <Text style={styles.sosPillText}>SOS</Text>
            </ScalePressable>
          </View>
        </View>

        {/* Big Greeting Headline */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingHeadline, { color: theme.text }]}>
            Namaste, {name || 'Explorer'}!
          </Text>
        </View>

        {/* Floating Search Capsule */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: theme.isDark ? 0.25 : 0.05,
                shadowRadius: 10,
                elevation: 3,
              },
            ]}
          >
            <MaterialIcons name="search" size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Explore ancient heritage, guides..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/explore')}
                style={styles.searchTuneBtn}
              >
                <MaterialIcons name="tune" size={17} color="#F59E0B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Story Circles Highlights Row */}
        {!searchQuery && (
          <View style={styles.storySection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storyScrollContent}
            >
              {STORY_HIGHLIGHTS.map((story) => (
                <TouchableOpacity
                  key={story.id}
                  style={styles.storyItem}
                  onPress={() => {
                    setSelectedCategory(story.category);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={story.colors}
                    style={styles.storyRing}
                  >
                    <View style={[styles.storyImgWrap, { backgroundColor: theme.background }]}>
                      <ExpoImage
                        source={{ uri: story.image }}
                        style={styles.storyImg}
                        contentFit="cover"
                        transition={200}
                      />
                    </View>
                  </LinearGradient>
                  <Text style={[styles.storyTitle, { color: theme.text }]} numberOfLines={1}>
                    {story.title}
                  </Text>
                  <Text style={[styles.storySub, { color: theme.textMuted }]} numberOfLines={1}>
                    {story.sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Big Hero Card: Laxmi Vilas Palace */}
        {!searchQuery && (
          <View style={styles.heroSection}>
            <View
              style={[
                styles.heroCard,
                {
                  width: HERO_CARD_WIDTH,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: theme.isDark ? 0.4 : 0.12,
                  shadowRadius: 18,
                  elevation: 6,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.94}
                style={StyleSheet.absoluteFill}
                onPress={() => router.push('/place/IND-GJ-01' as any)}
              >
                <ExpoImage
                  source={{ uri: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=900&q=80' }}
                  style={styles.heroImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                  style={StyleSheet.absoluteFill}
                />
              </TouchableOpacity>

              {/* Floating Audio Guide Pill */}
              <View style={styles.heroTopRow}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={[styles.audioGuidePill, isAudioPlaying && styles.audioGuidePillActive]}
                  onPress={toggleHeroAudio}
                  activeOpacity={0.85}
                >
                  <Text style={styles.audioGuidePillText}>
                    Audio Guide | {isAudioPlaying ? 'Playing' : 'Listen'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Card Content with Gold Seal */}
              <View style={styles.heroBottomRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>Laxmi Vilas Palace</Text>
                  <Text style={styles.heroSubtitle}>Laxmi Vilas Palace, Vadodara</Text>

                  {/* Audio Soundwave Bars */}
                  <TouchableOpacity
                    style={styles.heroPlaySoundwaveRow}
                    onPress={toggleHeroAudio}
                    activeOpacity={0.8}
                  >
                    <View style={styles.heroPlayIconWrap}>
                      <MaterialIcons
                        name={isAudioPlaying ? 'stop' : 'play-arrow'}
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.soundwaveBars}>
                      <View style={[styles.soundwaveBar, { height: isAudioPlaying ? 16 : 8 }]} />
                      <View style={[styles.soundwaveBar, { height: isAudioPlaying ? 22 : 14 }]} />
                      <View style={[styles.soundwaveBar, { height: isAudioPlaying ? 12 : 6 }]} />
                      <View style={[styles.soundwaveBar, { height: isAudioPlaying ? 20 : 12 }]} />
                      <View style={[styles.soundwaveBar, { height: isAudioPlaying ? 15 : 9 }]} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* UNESCO Gold Seal Badge */}
                <View style={styles.unescoGoldSeal}>
                  <View style={styles.unescoSealCircle}>
                    <MaterialIcons name="verified" size={24} color="#B45309" />
                    <Text style={styles.unescoSealLabel}>UNESCO</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 2-Column Bento Cockpit */}
        {!searchQuery && (
          <View style={styles.bentoSection}>
            <View style={styles.bentoGrid}>
              {/* Tile 1: Nearby Treasures (2.5D Radar Map) */}
              <TouchableOpacity
                style={styles.bentoCol}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#0F766E', '#042F2E']}
                  style={styles.bentoCardTeal}
                >
                  <View style={styles.bentoHeaderRow}>
                    <Text style={styles.bentoTitleTeal}>Nearby Treasures</Text>
                    <View style={styles.bento25DBadge}>
                      <Text style={styles.bento25DBadgeText}>2.5D</Text>
                    </View>
                  </View>

                  {/* Stylized Radar Graphic */}
                  <View style={styles.radarGraphicArea}>
                    <View style={styles.radarRingOuter} />
                    <View style={styles.radarRingInner} />
                    <View style={styles.radarCenterPin}>
                      <MaterialIcons name="location-on" size={20} color="#FBBF24" />
                    </View>
                    <Text style={styles.radarPinText1}>Amber Fort</Text>
                    <Text style={styles.radarPinText2}>Hawa Mahal</Text>
                  </View>

                  <Text style={styles.bentoFooterTeal}>4 Heritage Sites Close By</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Tile 2: Ask Me Anything (Yatra AI) */}
              <TouchableOpacity
                style={styles.bentoCol}
                onPress={() => {
                  setContext(null, null);
                  router.push('/(tabs)/ai');
                }}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#FB7185', '#E11D48']}
                  style={styles.bentoCardCoral}
                >
                  <Text style={styles.bentoTitleCoral}>Ask Me Anything</Text>
                  <Text style={styles.bentoSubCoral}>Yatra AI</Text>

                  <View style={styles.bentoMascotArea}>
                    <View style={styles.bentoMascotCircle}>
                      <MaterialIcons name="smart-toy" size={32} color="#FFFFFF" />
                      <View style={styles.bentoSpeechDots}>
                        <MaterialIcons name="chat-bubble" size={14} color="#FFE4E6" />
                      </View>
                    </View>
                  </View>

                  <Text style={styles.bentoPromptCoral}>Your personalized guide ready!</Text>
                  <View style={styles.bentoDiscoverBtn}>
                    <Text style={styles.bentoDiscoverBtnText}>Discover more...</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Live Weather & Crowd Radar */}
        <WeatherCrowdBar
          latitude={location.latitude || 22.3072}
          longitude={location.longitude || 73.1812}
          isLoading={isScreenLoading}
        />

        {/* Nearby Relics Section */}
        <View style={styles.relicsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Must-Visit Relics</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Sorted by live GPS proximity</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View Map →</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter Chips */}
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

          {/* Horizontal Exhibit Cards */}
          {isScreenLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 18 }}
            >
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
              contentContainerStyle={{ paddingHorizontal: 18, gap: 14, paddingTop: 4, paddingBottom: 10 }}
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
              <MaterialIcons name="search-off" size={44} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('home.noPlacesFound')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Safety SOS Modal */}
      <SafetySOSModal
        visible={sosVisible}
        onClose={() => setSosVisible(false)}
        latitude={location.latitude || 22.3072}
        longitude={location.longitude || 73.1812}
        currentLocationName={`${location.city || 'Vadodara'}, India`}
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

  // Dome Cutout Backdrop
  domeBackdropContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    overflow: 'hidden',
  },
  domeBackdropImage: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },

  // Header & Cockpit
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarGlowRing: {
    borderRadius: 22,
  },
  avatarGradientBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  headerTextWrap: {
    justifyContent: 'center',
  },
  userLabelSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
  userNameSmall: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  locationPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  sosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  sosPillText: {
    color: '#E11D48',
    fontSize: 11,
    fontWeight: '800',
  },

  // Greeting Section
  greetingSection: {
    paddingHorizontal: 18,
    marginTop: 6,
    marginBottom: 10,
  },
  greetingHeadline: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Story Circles
  storySection: {
    marginBottom: 16,
  },
  storyScrollContent: {
    paddingHorizontal: 18,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyImgWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  storyImg: {
    width: '100%',
    height: '100%',
  },
  storyTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'center',
  },
  storySub: {
    fontSize: 9.5,
    textAlign: 'center',
  },

  // Hero Card
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCard: {
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 14,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  audioGuidePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  audioGuidePillActive: {
    backgroundColor: '#E11D48',
  },
  audioGuidePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B1C1A',
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    marginBottom: 8,
  },
  heroPlaySoundwaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroPlayIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundwaveBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  soundwaveBar: {
    width: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 1.5,
  },
  unescoGoldSeal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unescoSealCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FDE68A',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unescoSealLabel: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.3,
  },

  // Bento Section
  bentoSection: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCol: {
    flex: 1,
  },
  bentoCardTeal: {
    borderRadius: 20,
    padding: 12,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoTitleTeal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  bento25DBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bento25DBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  radarGraphicArea: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  radarRingOuter: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  radarRingInner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  radarCenterPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPinText1: {
    position: 'absolute',
    top: 4,
    right: 2,
    fontSize: 8.5,
    color: '#FDE68A',
    fontWeight: '700',
  },
  radarPinText2: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    fontSize: 8.5,
    color: '#FDE68A',
    fontWeight: '700',
  },
  bentoFooterTeal: {
    color: '#E6FFFA',
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Bento Card Coral
  bentoCardCoral: {
    borderRadius: 20,
    padding: 12,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  bentoTitleCoral: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bentoSubCoral: {
    fontSize: 10,
    color: '#FFE4E6',
    fontWeight: '600',
  },
  bentoMascotArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  bentoMascotCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bentoSpeechDots: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  bentoPromptCoral: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  bentoDiscoverBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  bentoDiscoverBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Relics Section
  relicsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  relicCard: {
    width: RELIC_CARD_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  relicImgWrap: {
    width: '100%',
    height: 135,
    position: 'relative',
  },
  relicImage: {
    width: '100%',
    height: '100%',
  },
  relicEraBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 15, 20, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  relicEraText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  relicBookmarkBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relicBody: {
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  relicTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  relicCatText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  relicRatingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  relicTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  relicDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relicDistText: {
    fontSize: 10.5,
  },
  relicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  relicPrice: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  relicPriceSub: {
    fontSize: 10,
    fontWeight: '400',
  },
  relicDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  relicDirectionsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
  },
});
