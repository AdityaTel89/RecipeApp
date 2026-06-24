import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, FONTS } from '../config/constants';

/**
 * Custom SVG lightbulb icon — no emoji.
 */
function LightbulbIcon() {
  return (
    <View style={bulb.wrapper}>
      {/* Bulb top */}
      <View style={bulb.head} />
      {/* Bulb base */}
      <View style={bulb.base} />
      {/* Filament glow */}
      <View style={bulb.glow} />
    </View>
  );
}

const bulb = StyleSheet.create({
  wrapper: {
    width: 20,
    height: 22,
    alignItems: 'center',
  },
  head: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accentSecondary,
    marginBottom: 1,
  },
  base: {
    width: 10,
    height: 5,
    borderRadius: 2,
    backgroundColor: COLORS.accentSecondary,
    opacity: 0.7,
  },
  glow: {
    position: 'absolute',
    top: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },
});

/**
 * TipCard — Chef's tip block at the bottom of a recipe.
 * PRD §11.4
 *
 * Props:
 *   tip: string — the chef's tip text
 */
export function TipCard({ tip }) {
  if (!tip) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <LightbulbIcon />
        <Text style={styles.headerText}>Chef's Tip</Text>
      </View>
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.tipBg,
    borderRadius: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accentSecondary,
    padding: SPACING.base,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerText: {
    fontSize: TYPOGRAPHY.sectionHeaderSize,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  tipText: {
    fontSize: TYPOGRAPHY.bodySize,
    fontWeight: '400',
    fontFamily: FONTS.interRegular,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
