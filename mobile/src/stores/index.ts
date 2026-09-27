import { create } from 'zustand';
import { safeStorage } from '../utils/safeStorage';
import { favoritesApi } from '../services/api/favorites.api';
import { offlineApi } from '../services/api/offline.api';
import { ALL_SEED_PLACES } from '../utils/seedPlaces';

const CHAT_STORAGE_KEY = 'ai_chat_v1';
const CHAT_MAX_MESSAGES = 50;

// ============ USER STORE ============
interface UserState {
  userId: string | null;
  token: string | null;
  name: string;
  email: string | null;
  language: string;
  isGuest: boolean;
  interests: string[];
  travelStyle: string;
  duration: string;
  isOnboarded: boolean;
  themeMode: 'light' | 'dark';
  setUser: (userId: string, token: string, name?: string, email?: string, isGuest?: boolean) => void;
  setLanguage: (lang: string) => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setPreferences: (prefs: { interests?: string[]; travelStyle?: string; duration?: string }) => void;
  setOnboarded: (value: boolean) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  userId: null,
  token: null,
  name: 'Tourist',
  email: null,
  language: 'en',
  isGuest: true,
  interests: ['heritage'],
  travelStyle: 'moderate',
  duration: '90min',
  isOnboarded: false,
  themeMode: 'light',

  setUser: (userId, token, name, email, isGuest = false) => {
    set({
      userId,
      token,
      name: name || 'Tourist',
      email: email || null,
      isGuest,
    });
    get().saveToStorage();
  },

  setLanguage: (language) => {
    set({ language });
    get().saveToStorage();
  },

  setThemeMode: (themeMode) => {
    set({ themeMode });
    get().saveToStorage();
  },

  toggleTheme: () => {
    const next = get().themeMode === 'dark' ? 'light' : 'dark';
    set({ themeMode: next });
    get().saveToStorage();
  },

  setPreferences: (prefs) => {
    set((state) => ({
      interests: prefs.interests || state.interests,
      travelStyle: prefs.travelStyle || state.travelStyle,
      duration: prefs.duration || state.duration,
    }));
    get().saveToStorage();
  },

  setOnboarded: (isOnboarded) => {
    set({ isOnboarded });
    get().saveToStorage();
  },

  logout: async () => {
    try {
      await safeStorage.removeItem('user_store');
      set({
        userId: null,
        token: null,
        name: 'Tourist',
        email: null,
        isGuest: true,
        isOnboarded: false,
      });
    } catch (e) {
      console.error('Logout failed:', e);
    }
  },

  loadFromStorage: async () => {
    try {
      const data = await safeStorage.getItem('user_store');
      if (data) {
        const parsed = JSON.parse(data);
        set(parsed);
      }
    } catch (e) {
      console.warn('[UserStore] Failed to load user store:', e);
    }
  },

  saveToStorage: async () => {
    try {
      const s = get();
      const cleanData = {
        userId: s.userId,
        token: s.token,
        name: s.name,
        email: s.email,
        language: s.language,
        isGuest: s.isGuest,
        interests: s.interests,
        travelStyle: s.travelStyle,
        duration: s.duration,
        isOnboarded: s.isOnboarded,
        themeMode: s.themeMode,
      };
      await safeStorage.setItem('user_store', JSON.stringify(cleanData));
    } catch (e) {
      console.warn('[UserStore] Failed to save user store:', e);
    }
  },
}));

// ============ PLACES STORE ============
export interface Place {
  id: string;
  name: string;
  nameHi?: string;
  nameGu?: string;
  latitude: number;
  longitude: number;
  category: string;
  imageUrl?: string;
  openingHours?: string;
  rating?: number;
  shortDescription?: string;
  distance?: number;
  city?: string;
  district?: string;
  state?: string;
  heritageRecord?: {
    placeId?: string;
    shortStory: string;
    history?: string;
    detailedHistory?: string;
    significance?: string;
    architecture?: string;
    period?: string;
    keyFacts?: string[];
    nearbyCluster?: string;
    nearbyMonuments?: any[];
    visitingInfo?: any;
    sources?: Array<{
      sourceName: string;
      sourceUrl?: string;
      referenceText?: string;
    }>;
    [key: string]: any;
  };
  [key: string]: any;
}

interface PlacesState {
  places: Place[];
  selectedPlace: Place | null;
  favorites: string[];
  isLoading: boolean;
  setPlaces: (places: Place[]) => void;
  setSelectedPlace: (place: Place | null) => void;
  toggleFavorite: (placeId: string) => Promise<void>;
  loadFavorites: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const usePlacesStore = create<PlacesState>((set, get) => ({
  places: ALL_SEED_PLACES,
  selectedPlace: null,
  favorites: [],
  isLoading: true,

  setPlaces: (places) => set({ places }),
  setSelectedPlace: (selectedPlace) => set({ selectedPlace }),

  toggleFavorite: async (placeId) => {
    const { favorites } = get();
    const isFav = favorites.includes(placeId);
    const updated = isFav ? favorites.filter((id) => id !== placeId) : [...favorites, placeId];
    set({ favorites: updated });

    try {
      const userId = useUserStore.getState().userId || undefined;
      if (isFav) {
        await favoritesApi.removeFavorite(placeId, userId);
      } else {
        await favoritesApi.addFavorite(placeId, userId);
      }
      await safeStorage.setItem('user_favorites', JSON.stringify(updated));
    } catch (e) {
      // Keep local state on network error
      console.warn('[placesStore] Favorite sync notice:', e);
    }
  },

  loadFavorites: async () => {
    try {
      const cached = await safeStorage.getItem('user_favorites');
      const localIds: string[] = cached ? JSON.parse(cached) : [];
      if (localIds.length > 0) {
        set({ favorites: localIds });
      }
      const userId = useUserStore.getState().userId || undefined;
      const res: any = await favoritesApi.getFavorites(userId);
      if (res.success && Array.isArray(res.data)) {
        const serverIds = res.data.map((p: any) => p.id || p.placeId).filter(Boolean);
        // Union merge: never wipe local offline favorites on empty server
        const merged = Array.from(new Set([...localIds, ...serverIds]));
        if (merged.length > 0) {
          set({ favorites: merged });
          await safeStorage.setItem('user_favorites', JSON.stringify(merged));
        }
      }
    } catch (e) {
      // Local cache used
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
}));

// ============ CHAT STORE ============
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ name: string; url?: string; text: string }>;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  contextPlaceId: string | null;
  contextPlaceName: string | null;
  mode: 'short' | 'detailed' | 'child' | 'narrative';
  isTyping: boolean;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setContext: (placeId: string | null, placeName: string | null) => void;
  setMode: (mode: 'short' | 'detailed' | 'child' | 'narrative') => void;
  setTyping: (typing: boolean) => void;
  clearChat: () => void;
  loadChat: () => Promise<void>;
}

const persistChat = (messages: ChatMessage[], contextPlaceId: string | null, contextPlaceName: string | null) => {
  safeStorage
    .setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({ messages: messages.slice(-CHAT_MAX_MESSAGES), contextPlaceId, contextPlaceName })
    )
    .catch(() => {});
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  contextPlaceId: null,
  contextPlaceName: null,
  mode: 'short',
  isTyping: false,

  addMessage: (msg) =>
    set((state) => {
      const messages = [
        ...state.messages,
        { ...msg, id: `msg-${Date.now()}-${Math.random()}`, timestamp: Date.now() },
      ].slice(-CHAT_MAX_MESSAGES);
      persistChat(messages, state.contextPlaceId, state.contextPlaceName);
      return { messages };
    }),

  setContext: (contextPlaceId, contextPlaceName) =>
    set((state) => {
      persistChat(state.messages, contextPlaceId, contextPlaceName);
      return { contextPlaceId, contextPlaceName };
    }),
  setMode: (mode) => set({ mode }),
  setTyping: (isTyping) => set({ isTyping }),
  clearChat: () => {
    safeStorage.removeItem(CHAT_STORAGE_KEY).catch(() => {});
    set({ messages: [], contextPlaceId: null, contextPlaceName: null });
  },
  loadChat: async () => {
    try {
      const raw = await safeStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.messages)) {
        set({
          messages: parsed.messages.slice(-CHAT_MAX_MESSAGES),
          contextPlaceId: parsed.contextPlaceId || null,
          contextPlaceName: parsed.contextPlaceName || null,
        });
      }
    } catch {
      // Start fresh on corrupt cache
    }
  },
}));

// ============ OFFLINE STORE ============
export interface OfflinePackage {
  packageId: string;
  version: string;
  downloadedAt: string;
  place: Place;
  heritage: any;
  artifacts: any[];
  offlineAudioGuide: {
    en: string;
    hi: string;
    gu: string;
  };
}

interface OfflineState {
  downloadedPackages: Record<string, OfflinePackage>;
  isOfflineMode: boolean;
  downloadPlace: (placeId: string) => Promise<boolean>;
  removeDownload: (placeId: string) => Promise<void>;
  isDownloaded: (placeId: string) => boolean;
  getPackage: (placeId: string) => OfflinePackage | null;
  setOfflineMode: (enabled: boolean) => void;
  loadFromStorage: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  downloadedPackages: {},
  isOfflineMode: false,

  downloadPlace: async (placeId: string) => {
    const prevPackages = get().downloadedPackages;
    try {
      const res: any = await offlineApi.getPlacePackage(placeId);
      if (res?.success && res?.data?.packageId && res?.data?.place) {
        const pkg: OfflinePackage = res.data;
        const next = { ...prevPackages, [placeId]: pkg };
        await safeStorage.setItem('offline_packages', JSON.stringify(next));
        set({ downloadedPackages: next });
        return true;
      }
    } catch (e) {
      console.warn('[OfflineStore] Remote fetch notice, checking local catalog:', e);
    }

    const matched = ALL_SEED_PLACES.find(
      (p) => p.id === placeId || p.id?.toLowerCase() === placeId?.toLowerCase()
    );
    if (matched) {
      const hr = (matched.heritageRecord as any) || {};
      const pkg: OfflinePackage = {
        packageId: `pkg-${matched.id}`,
        version: '1.0.0',
        downloadedAt: new Date().toISOString(),
        place: matched,
        heritage: hr,
        artifacts: (matched as any).artifacts || [],
        offlineAudioGuide: {
          en: hr.shortStory || matched.shortDescription,
          hi: hr.shortStoryHi || hr.shortStory || matched.shortDescription,
          gu: hr.shortStoryGu || hr.shortStory || matched.shortDescription,
        },
      };
      try {
        const next = { ...prevPackages, [matched.id]: pkg };
        await safeStorage.setItem('offline_packages', JSON.stringify(next));
        set({ downloadedPackages: next });
        return true;
      } catch (err) {
        console.error('[OfflineStore] Failed to persist offline package:', err);
        set({ downloadedPackages: prevPackages });
        return false;
      }
    }

    return false;
  },

  removeDownload: async (placeId: string) => {
    const prevPackages = get().downloadedPackages;
    const next = { ...prevPackages };
    delete next[placeId];
    try {
      await safeStorage.setItem('offline_packages', JSON.stringify(next));
      set({ downloadedPackages: next });
    } catch (err) {
      console.error('[OfflineStore] Failed to remove package from storage:', err);
    }
  },

  isDownloaded: (placeId: string) => {
    return !!get().downloadedPackages[placeId];
  },

  getPackage: (placeId: string) => {
    return get().downloadedPackages[placeId] || null;
  },

  setOfflineMode: (isOfflineMode) => set({ isOfflineMode }),

  loadFromStorage: async () => {
    try {
      const data = await safeStorage.getItem('offline_packages');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const validated: Record<string, OfflinePackage> = {};
          for (const [k, v] of Object.entries(parsed)) {
            if (v && typeof v === 'object' && (v as any).packageId && (v as any).place) {
              validated[k] = v as OfflinePackage;
            }
          }
          set({ downloadedPackages: validated });
        }
      }
    } catch (e) {
      console.warn('[OfflineStore] Failed to load offline packages:', e);
    }
  },
}));
