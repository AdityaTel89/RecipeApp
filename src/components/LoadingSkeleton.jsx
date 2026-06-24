import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, LOADING_MESSAGES, FONTS } from '../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * A single shimmer bar — reusable building block.
 */
function ShimmerBar({ width, height = 14, style }) {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        styles.shimmerBar,
        {
          width,
          height,
          backgroundColor: COLORS.skeletonBase,
          opacity: shimmerAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * AnimatedPan — engaging wobbly sauté pan with rising steam animations.
 */
function AnimatedPan() {
  const tiltAnim   = useRef(new Animated.Value(0)).current;
  const steamAnim1 = useRef(new Animated.Value(0)).current;
  const steamAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop tilt/wobble back and forth
    Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: -1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Loop steam line 1 rising
    Animated.loop(
      Animated.sequence([
        Animated.timing(steamAnim1, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(steamAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Loop steam line 2 rising (delayed)
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(steamAnim2, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(steamAnim2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 400);

    return () => clearTimeout(timer);
  }, [tiltAnim, steamAnim1, steamAnim2]);

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  const translateY1 = steamAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const opacity1 = steamAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.7, 0],
  });

  const translateY2 = steamAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const opacity2 = steamAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.7, 0],
  });

  return (
    <View style={animPan.wrapper}>
      {/* Rising Steam */}
      <Animated.View
        style={[
          animPan.steam,
          { left: 16, transform: [{ translateY: translateY1 }], opacity: opacity1 },
        ]}
      />
      <Animated.View
        style={[
          animPan.steam,
          { left: 24, transform: [{ translateY: translateY2 }], opacity: opacity2 },
        ]}
      />

      {/* Tilting Pan */}
      <Animated.View style={{ transform: [{ rotate }] }}>
        <View style={animPan.panBody} />
        <View style={animPan.handle} />
      </Animated.View>
    </View>
  );
}

const animPan = StyleSheet.create({
  wrapper: {
    width: 60,
    height: 50,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  panBody: {
    width: 32,
    height: 18,
    borderRadius: 9,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: COLORS.accentPrimary,
  },
  handle: {
    position: 'absolute',
    bottom: 6,
    right: -12,
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accentPrimary,
  },
  steam: {
    position: 'absolute',
    top: 2,
    width: 2.5,
    height: 8,
    borderRadius: 1.25,
    backgroundColor: COLORS.accentSecondary,
  },
});

/**
 * LoadingSkeleton — animated skeleton cards + rotating contextual messages.
 * PRD §6.4 (Option A + B combined)
 *
 * Skeleton shimmer: EDE4D8 → F7F0E8 → EDE4D8, looping.
 * Messages rotate every 2s with fade transition.
 */
export function LoadingSkeleton() {
  const [msgIndex, setMsgIndex] = useState(0);
  const msgOpacity = useRef(new Animated.Value(1)).current;

  // Rotate loading messages every 2 seconds with fade
  useEffect(() => {
    const cycle = () => {
      // Fade out
      Animated.timing(msgOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        // Fade in
        Animated.timing(msgOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    };

    const interval = setInterval(cycle, 2000);
    return () => clearInterval(interval);
  }, [msgOpacity]);

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityLabel="Generating your recipe"
    >
      {/* Skeleton card 1 — recipe header */}
      <View style={styles.card}>
        {/* Sauté pan animation */}
        <AnimatedPan />

        {/* Title skeleton */}
        <ShimmerBar width="75%" height={22} style={styles.bar} />
        <ShimmerBar width="55%" height={22} style={styles.bar} />

        {/* Meta row */}
        <View style={styles.metaRow}>
          <ShimmerBar width={70} height={12} />
          <ShimmerBar width={80} height={12} />
          <ShimmerBar width={55} height={12} />
        </View>

        <View style={styles.divider} />

        {/* Ingredient pills */}
        <ShimmerBar width={90} height={11} style={[styles.bar, { marginBottom: SPACING.md }]} />
        <View style={styles.pillRow}>
          <ShimmerBar width={80} height={28} style={styles.pill} />
          <ShimmerBar width={100} height={28} style={styles.pill} />
          <ShimmerBar width={65} height={28} style={styles.pill} />
          <ShimmerBar width={90} height={28} style={styles.pill} />
        </View>

        <View style={styles.divider} />

        {/* Steps skeleton */}
        <ShimmerBar width={100} height={11} style={[styles.bar, { marginBottom: SPACING.md }]} />
        {[95, 80, 88, 72].map((w, i) => (
          <View key={i} style={styles.stepSkeletonRow}>
            {/* Circle */}
            <ShimmerBar width={24} height={24} style={styles.stepCircle} />
            <View style={styles.stepLines}>
              <ShimmerBar width={`${w}%`} height={12} style={{ marginBottom: 5 }} />
              <ShimmerBar width={`${w - 15}%`} height={12} />
            </View>
          </View>
        ))}
      </View>

      {/* Rotating contextual message */}
      <Animated.Text style={[styles.message, { opacity: msgOpacity }]}>
        {LOADING_MESSAGES[msgIndex]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: SPACING.xl,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  shimmerBar: {
    borderRadius: 6,
  },
  bar: {
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.base,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: SPACING.base,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pill: {
    borderRadius: 100,
  },
  stepSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.base,
    gap: SPACING.md,
  },
  stepCircle: {
    borderRadius: 12,
    flexShrink: 0,
  },
  stepLines: {
    flex: 1,
  },
  message: {
    marginTop: SPACING.xl,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sectionHeaderSize,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    fontWeight: '400',
    letterSpacing: 0.2,
    fontFamily: FONTS.interRegular,
  },
});
