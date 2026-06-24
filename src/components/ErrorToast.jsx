import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, FONTS } from '../config/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Custom SVG warning triangle icon.
 */
function WarningIcon() {
  return (
    <View style={warnIcon.wrapper}>
      <View style={warnIcon.triangle} />
      <View style={warnIcon.exclamTop} />
      <View style={warnIcon.exclamDot} />
    </View>
  );
}

const warnIcon = StyleSheet.create({
  wrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.85)',
  },
  exclamTop: {
    position: 'absolute',
    top: 5,
    width: 2,
    height: 6,
    borderRadius: 1,
    backgroundColor: COLORS.error,
  },
  exclamDot: {
    position: 'absolute',
    top: 13,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.error,
  },
});

/**
 * Custom SVG × dismiss icon.
 */
function CloseIcon() {
  return (
    <View style={closeIcon.wrapper}>
      <View style={[closeIcon.line, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[closeIcon.line, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

const closeIcon = StyleSheet.create({
  wrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
    width: 11,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
});

/**
 * ErrorToast — slides in from the top of the screen.
 * Auto-dismisses in 4 seconds. User can also swipe/tap close.
 * PRD §6.6
 *
 * Props:
 *   message: string       — error text to display
 *   onDismiss: () => void — called when toast should be hidden
 *   onRetry?: () => void  — optional retry callback
 */
export function ErrorToast({ message, onDismiss, onRetry }) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const dismissTimer = useRef(null);

  useEffect(() => {
    // §7.4 — Error haptic when toast appears
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

    // Slide in
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();

    // Auto-dismiss after 4s
    dismissTimer.current = setTimeout(() => {
      slideOut();
    }, 4000);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  function slideOut() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }

  return (
    <Animated.View
      style={[styles.toast, { transform: [{ translateY }] }]}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
    >
      <WarningIcon />

      <View style={styles.textBlock}>
        <Text style={styles.message}>{message}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} accessibilityLabel="Retry">
            <Text style={styles.retryBtn}>Retry</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={slideOut}
        style={styles.closeBtn}
        accessibilityLabel="Dismiss error"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <CloseIcon />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    zIndex: 999,
    backgroundColor: COLORS.error,
    borderRadius: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  message: {
    fontSize: TYPOGRAPHY.sectionHeaderSize,
    fontWeight: '400',
    fontFamily: FONTS.interRegular,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  retryBtn: {
    fontSize: TYPOGRAPHY.microSize,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -SPACING.xs,
  },
});
