import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, FONTS } from '../config/constants';

/**
 * Custom SVG pan icon rendered via React Native's View primitives.
 * No emoji, no external icon library.
 */
function PanIcon() {
  return (
    <View style={icon.wrapper}>
      {/* Pan body */}
      <View style={icon.panBody} />
      {/* Handle */}
      <View style={icon.handle} />
      {/* Steam lines */}
      <View style={[icon.steam, { left: 8, height: 5 }]} />
      <View style={[icon.steam, { left: 14, height: 8 }]} />
      <View style={[icon.steam, { left: 20, height: 5 }]} />
    </View>
  );
}

/**
 * Header — app name, tagline, and custom pan SVG.
 */
export function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <PanIcon />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.title}>Smart Ingredient</Text>
          <Text style={styles.tagline}>Your kitchen, your recipe.</Text>
        </View>
      </View>
    </View>
  );
}

const icon = StyleSheet.create({
  wrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panBody: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 28,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accentPrimary,
  },
  handle: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accentPrimary,
  },
  steam: {
    position: 'absolute',
    top: 2,
    width: 2,
    borderRadius: 1,
    backgroundColor: COLORS.accentSecondary,
    opacity: 0.7,
  },
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.heroSize,
    fontWeight: '700',
    fontFamily: FONTS.playfairBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sectionHeaderSize,
    color: COLORS.textSecondary,
    fontWeight: '400',
    fontFamily: FONTS.interRegular,
    marginTop: 1,
  },
});
