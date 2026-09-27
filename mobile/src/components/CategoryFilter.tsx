import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, CATEGORIES, getAppTheme } from '../constants/theme';
import { useUserStore } from '../stores';
import { useTranslation } from '../hooks/useTranslation';

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const { t, getCategoryName } = useTranslation();
  const themeMode = useUserStore((s) => s.themeMode);
  const theme = getAppTheme(themeMode);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor: !selected
              ? (theme.isDark ? theme.primary : '#1B1C1A')
              : theme.surfaceElevated,
            borderColor: !selected
              ? (theme.isDark ? theme.primary : '#1B1C1A')
              : theme.border,
          },
        ]}
        onPress={() => onSelect(null)}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name="apps"
          size={16}
          color={!selected ? (theme.isDark ? '#0F0F0F' : '#FFFFFF') : theme.textSecondary}
        />
        <Text
          style={[
            styles.chipText,
            {
              color: !selected ? (theme.isDark ? '#0F0F0F' : '#FFFFFF') : theme.textSecondary,
              fontWeight: !selected ? '700' : '500',
            },
          ]}
        >
          {t('categories.all')}
        </Text>
      </TouchableOpacity>

      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? cat.color
                  : theme.surfaceElevated,
                borderColor: isSelected ? cat.color : theme.border,
              },
            ]}
            onPress={() => onSelect(isSelected ? null : cat.key)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={cat.icon as any}
              size={16}
              color={isSelected ? '#FFFFFF' : cat.color}
            />
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {getCategoryName(cat.key)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  chipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#0F0F0F',
  },
});
