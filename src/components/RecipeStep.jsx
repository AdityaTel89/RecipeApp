import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, FONTS } from '../config/constants';

/**
 * RecipeStep — a single numbered cooking step.
 *
 * Props:
 *   stepNumber: number  — 1-indexed step number
 *   title: string       — short step title (e.g. "Prepare the rice")
 *   instruction: string — full 2–5 sentence instruction body
 */
export function RecipeStep({ stepNumber, title, instruction }) {
  return (
    <View
      style={styles.container}
      accessibilityLabel={`Step ${stepNumber}: ${title}. ${instruction}`}
    >
      {/* Numbered circle */}
      <View style={styles.circle}>
        <Text style={styles.circleNum}>{stepNumber}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : null}
        <Text style={styles.body}>{instruction}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.base,
    gap: SPACING.md,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  circleNum: {
    fontSize: TYPOGRAPHY.stepNumberSize,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textOnAccent,
    lineHeight: 16,
  },
  content: {
    flex: 1,
    gap: SPACING.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  body: {
    fontSize: TYPOGRAPHY.bodySize,
    fontWeight: '400',
    fontFamily: FONTS.interRegular,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
});
