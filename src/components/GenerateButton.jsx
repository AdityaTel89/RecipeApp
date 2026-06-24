import { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, FONTS } from '../config/constants';

/**
 * Custom SVG chef hat icon — no emoji.
 */
function ChefHatIcon({ color = COLORS.textOnAccent }) {
  return (
    <View style={hat.wrapper}>
      {/* Brim */}
      <View style={[hat.brim, { backgroundColor: color }]} />
      {/* Top puff */}
      <View style={[hat.puff, { backgroundColor: color }]} />
      {/* Left puff */}
      <View style={[hat.leftPuff, { backgroundColor: color }]} />
      {/* Right puff */}
      <View style={[hat.rightPuff, { backgroundColor: color }]} />
    </View>
  );
}

const hat = StyleSheet.create({
  wrapper: {
    width: 22,
    height: 20,
    alignItems: 'center',
  },
  brim: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 5,
    borderRadius: 2,
    opacity: 0.9,
  },
  puff: {
    position: 'absolute',
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  leftPuff: {
    position: 'absolute',
    top: 4,
    left: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    opacity: 0.8,
  },
  rightPuff: {
    position: 'absolute',
    top: 4,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    opacity: 0.8,
  },
});

/**
 * Warning badge dot shown when exactly 1 ingredient is entered.
 */
function WarningBadge() {
  return (
    <View style={badge.wrapper}>
      <Text style={badge.text}>!</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F7A25A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bgBase,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 13,
  },
});

export function GenerateButton({ onPress, disabled, isWarning, isLoading }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    if (disabled || isLoading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }

  function handlePress() {
    if (disabled || isLoading) return;
    // Heavy haptic on CTA tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    onPress();
  }

  const isInactive = disabled || isLoading;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View>
          <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              styles.button,
              isInactive && styles.buttonDisabled,
              isWarning && !isInactive && styles.buttonWarning,
            ]}
            accessibilityLabel="Generate my recipe"
            accessibilityState={{ disabled: isInactive }}
            accessibilityRole="button"
          >
            <View style={styles.inner}>
              {!isLoading && (
                <ChefHatIcon
                  color={isInactive ? COLORS.buttonDisabledText : COLORS.textOnAccent}
                />
              )}
              <Text
                style={[
                  styles.label,
                  isInactive && styles.labelDisabled,
                ]}
              >
                {isLoading ? 'Generating Recipe...' : 'Generate My Recipe'}
              </Text>
            </View>
          </Pressable>

          {/* Warning badge when exactly 1 ingredient */}
          {isWarning && !isInactive ? <WarningBadge /> : null}
        </View>
      </Animated.View>

      <Text style={styles.microCopy}>
        AI-powered · Works best with 3–5 ingredients
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    marginHorizontal: 0,
  },
  button: {
    height: 56,
    backgroundColor: COLORS.accentPrimary,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.buttonDisabled,
  },
  buttonWarning: {
    backgroundColor: COLORS.accentPrimary,
    opacity: 0.9,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.buttonSize,
    fontWeight: '600',
    fontFamily: FONTS.interSemiBold,
    color: COLORS.textOnAccent,
    letterSpacing: 0.2,
  },
  labelDisabled: {
    color: COLORS.buttonDisabledText,
  },
  microCopy: {
    fontSize: TYPOGRAPHY.microSize,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: FONTS.interRegular,
  },
});
