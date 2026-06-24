import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Animated,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, VALIDATION, FONTS, QUICK_ADD_INGREDIENTS } from '../config/constants';
import { IngredientTag } from './IngredientTag';

// Common multi-word ingredients to preserve when splitting on spaces (no commas)
const PRESERVED_MULTI_WORDS = [
  'soy sauce', 'olive oil', 'sesame oil', 'chicken breast', 'sour cream',
  'black pepper', 'tomato paste', 'cream cheese', 'coconut milk', 'maple syrup',
  'peanut butter', 'brown sugar', 'garlic powder', 'onion powder', 'chili powder'
];

/**
 * Parse input text into ingredient tokens.
 * Handles both comma-separated and space-separated text, while preserving
 * common multi-word pantry items from getting split.
 */
function parseIngredients(text) {
  if (!text || typeof text !== 'string') return [];

  const normalized = text.toLowerCase().trim();

  // If input contains commas, parse strictly by commas
  if (normalized.includes(',')) {
    const seen = new Set();
    return normalized
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length >= VALIDATION.MIN_INGREDIENT_LENGTH)
      .filter(item => {
        if (seen.has(item)) return false;
        seen.add(item);
        return true;
      });
  }

  // If no commas, split on spaces but preserve common multi-word ingredients
  const placeholders = {};
  let tempText = normalized;

  PRESERVED_MULTI_WORDS.forEach((phrase, index) => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    if (regex.test(tempText)) {
      const placeholder = `__ph_${index}__`;
      placeholders[placeholder] = phrase;
      tempText = tempText.replace(regex, placeholder);
    }
  });

  const tokens = tempText.split(/\s+/).filter(Boolean);
  const parsed = [];
  const seen = new Set();

  tokens.forEach(token => {
    let restored = token;
    if (placeholders[token]) {
      restored = placeholders[token];
    }
    
    if (restored.startsWith('__ph_') || restored.length >= VALIDATION.MIN_INGREDIENT_LENGTH) {
      if (!seen.has(restored)) {
        seen.add(restored);
        parsed.push(restored);
      }
    }
  });

  return parsed;
}

/**
 * IngredientInput — text field with live tag parsing, focus animation,
 * ingredient counter, inline hints, debounced parsing, and shake animation.
 * PRD §6.2, §7.1, §7.3, §8.1, §13
 *
 * Props:
 *   onIngredientsChange(ingredients: string[]) — called on every parse
 *   isLoading: boolean
 *   shake: boolean — when toggled to true, triggers the shake animation
 *   ingredients: string[] — controlled ingredients from parent
 *   setIngredients: function — state setter from parent
 */
export function IngredientInput({ onIngredientsChange, isLoading, shake, ingredients, setIngredients }) {
  const [inputValue, setInputValue]     = useState('');
  const [isFocused, setIsFocused]       = useState(false);
  const [localIngredients, setLocalIngredients] = useState([]);

  const activeIngredients = ingredients || localIngredients;
  const activeSetIngredients = setIngredients || setLocalIngredients;

  const borderColor   = useRef(new Animated.Value(0)).current;
  const focusLabelOp  = useRef(new Animated.Value(0)).current;  // §7.1 focus label
  const shakeAnim     = useRef(new Animated.Value(0)).current;  // §8.1 shake
  const debounceTimer = useRef(null);                           // §13 debounce

  // Sync text input with parent reset
  useEffect(() => {
    if (activeIngredients.length === 0) {
      setInputValue('');
    }
  }, [activeIngredients]);

  // ── §7.1 — Focus-triggered instruction label ────────────────────────────────
  function handleFocus() {
    setIsFocused(true);
    Animated.parallel([
      Animated.timing(borderColor, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(focusLabelOp, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }

  // ── §7.1 — Focus-triggered instruction label ──
  function handleBlur() {
    setIsFocused(false);
    Animated.parallel([
      Animated.timing(borderColor, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(focusLabelOp, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }

  // ── §8.1 — Shake animation triggered by parent ──────────────────────────────
  useEffect(() => {
    if (!shake) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3,  duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 40, useNativeDriver: true }),
    ]).start();
  }, [shake, shakeAnim]);

  const animatedBorderColor = borderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.borderSubtle, COLORS.accentSecondary],
  });

  // ── §13 — 100ms debounced parsing ───────────────────────────────────────────
  const handleChange = useCallback((text) => {
    setInputValue(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const parsed = parseIngredients(text);
      const capped = parsed.slice(0, VALIDATION.MAX_INGREDIENTS);
      activeSetIngredients(capped);
      onIngredientsChange(capped);
    }, 100);
  }, [onIngredientsChange, activeSetIngredients]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  function removeIngredient(label) {
    const updated = activeIngredients.filter(i => i !== label);
    const newText = updated.join(', ') + (updated.length > 0 ? ', ' : '');
    setInputValue(newText);
    activeSetIngredients(updated);
    onIngredientsChange(updated);
  }

  function toggleIngredient(item) {
    const isAdded = activeIngredients.includes(item);
    let updated;
    if (isAdded) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      updated = activeIngredients.filter(i => i !== item);
    } else {
      if (activeIngredients.length >= VALIDATION.MAX_INGREDIENTS) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      updated = [...activeIngredients, item];
    }
    const newText = updated.join(', ') + (updated.length > 0 ? ', ' : '');
    setInputValue(newText);
    activeSetIngredients(updated);
    onIngredientsChange(updated);
  }

  const count      = activeIngredients.length;
  const hasNoComma = inputValue.trim().length > 2 && !inputValue.includes(',');
  const isAtMax    = count >= VALIDATION.MAX_INGREDIENTS;

  // Counter color
  let counterColor = COLORS.textSecondary;
  if (count >= 8) counterColor = COLORS.accentPrimary;
  if (count >= VALIDATION.MAX_INGREDIENTS) counterColor = COLORS.error;

  return (
    <View style={styles.container}>
      {/* Section label */}
      <Text style={styles.sectionLabel}>WHAT'S IN YOUR KITCHEN?</Text>

      {/* §7.1 — Focus-triggered instruction label (fades in when keyboard opens) */}
      <Animated.Text style={[styles.focusHint, { opacity: focusLabelOp }]}>
        Separate ingredients with commas
      </Animated.Text>

      {/* Animated border input with shake */}
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor: animatedBorderColor,
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="e.g. eggs, onion, garlic, tomatoes"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          multiline
          returnKeyType="done"
          blurOnSubmit
          accessibilityLabel="Ingredient input field"
        />

        {/* Ingredient counter */}
        <Text style={[styles.counter, { color: counterColor }]}>
          {count} / {VALIDATION.MAX_INGREDIENTS} ingredients
        </Text>
      </Animated.View>

      {/* Inline hint — no-comma warning */}
      {hasNoComma && !isLoading ? (
        <Text style={styles.hint}>
          Separate ingredients with commas — e.g. eggs, butter, flour
        </Text>
      ) : null}

      {isAtMax ? (
        <Text style={styles.hintWarn}>
          That's plenty! Using the first {VALIDATION.MAX_INGREDIENTS} ingredients.
        </Text>
      ) : null}

      {/* Quick Add Pantry Staples */}
      {!isLoading ? (
        <View style={styles.quickAddSection}>
          <Text style={styles.quickAddLabel}>QUICK ADD PANTRY STAPLES</Text>
          <View style={styles.quickAddGrid}>
            {QUICK_ADD_INGREDIENTS.map(item => {
              const isAdded = activeIngredients.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleIngredient(item)}
                  style={[
                    styles.quickAddPill,
                    isAdded && styles.quickAddPillActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${isAdded ? 'Remove' : 'Add'} ${item}`}
                >
                  <Text
                    style={[
                      styles.quickAddText,
                      isAdded && styles.quickAddTextActive,
                    ]}
                  >
                    {isAdded ? '✓ ' : '+ '}
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Detected ingredient tags */}
      {activeIngredients.length > 0 ? (
        <View
          style={styles.tagsSection}
          accessibilityLabel={`Detected ingredients list. ${count} item${count === 1 ? '' : 's'} added.`}
        >
          <Text style={styles.tagsLabel}>DETECTED INGREDIENTS:</Text>
          <View style={styles.tagsRow}>
            {activeIngredients.map(item => (
              <IngredientTag
                key={item}
                label={item}
                onRemove={() => removeIngredient(item)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.microSize,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  // §7.1 — focus-triggered instruction label
  focusHint: {
    fontSize: TYPOGRAPHY.microSize,
    color: COLORS.accentSecondary,
    fontWeight: '500',
    fontFamily: FONTS.interMedium,
    fontStyle: 'italic',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.bgCard,
    overflow: 'hidden',
  },
  input: {
    padding: SPACING.base,
    fontSize: TYPOGRAPHY.bodySize,
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    fontWeight: '400',
    fontFamily: FONTS.interRegular,
  },
  counter: {
    fontSize: TYPOGRAPHY.microSize,
    fontWeight: '500',
    fontFamily: FONTS.interMedium,
    textAlign: 'right',
    paddingRight: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  hint: {
    fontSize: TYPOGRAPHY.microSize,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    paddingHorizontal: SPACING.xs,
    fontFamily: FONTS.interRegular,
  },
  hintWarn: {
    fontSize: TYPOGRAPHY.microSize,
    color: COLORS.accentPrimary,
    fontWeight: '500',
    fontFamily: FONTS.interMedium,
    paddingHorizontal: SPACING.xs,
  },
  quickAddSection: {
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  quickAddLabel: {
    fontSize: TYPOGRAPHY.microSize,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  quickAddPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.tag,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.xs,
    marginRight: SPACING.xs,
  },
  quickAddPillActive: {
    backgroundColor: COLORS.tagBg,
    borderColor: COLORS.accentSecondary,
  },
  quickAddText: {
    fontSize: TYPOGRAPHY.tagSize,
    fontWeight: '500',
    fontFamily: FONTS.interMedium,
    color: COLORS.textSecondary,
  },
  quickAddTextActive: {
    color: COLORS.textPrimary,
  },
  tagsSection: {
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  tagsLabel: {
    fontSize: TYPOGRAPHY.microSize,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});