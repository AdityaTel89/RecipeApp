import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, FONTS } from '../config/constants';

/**
 * Custom SVG × icon for removing a tag.
 */
function RemoveIcon() {
  return (
    <View style={removeIcon.container}>
      <View style={[removeIcon.line, removeIcon.lineLeft]} />
      <View style={[removeIcon.line, removeIcon.lineRight]} />
    </View>
  );
}

const removeIcon = StyleSheet.create({
  container: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
    width: 9,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: COLORS.accentPrimary,
  },
  lineLeft: {
    transform: [{ rotate: '45deg' }],
  },
  lineRight: {
    transform: [{ rotate: '-45deg' }],
  },
});

/**
 * IngredientTag — a single pill tag with spring entrance and tap-to-remove.
 * PRD §6.2, §7.4, §12
 *
 * Props:
 *   label: string       — ingredient name to display
 *   onRemove: () => void — called when × is tapped
 */
export function IngredientTag({ label, onRemove }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Light haptic when tag appears (§7.4 — tag added)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  }, [scaleAnim]);

  function handleRemove() {
    // Light haptic when tag removed (§7.4 — tag removed)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onRemove();
  }

  return (
    <Animated.View style={[styles.tagWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.tag}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Pressable
          onPress={handleRemove}
          style={styles.removeBtn}
          accessibilityLabel={`Remove ${label}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RemoveIcon />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tagWrapper: {
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tagBg,
    borderWidth: 1.5,
    borderColor: COLORS.accentSecondary,
    borderRadius: 100,
    paddingVertical: SPACING.xs,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.tagSize,
    fontWeight: '500',
    fontFamily: FONTS.interMedium,
    color: COLORS.textPrimary,
    maxWidth: 120,
  },
  removeBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
