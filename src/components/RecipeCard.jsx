import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, FONTS } from '../config/constants';
import { RecipeStep } from './RecipeStep';
import { TipCard } from './TipCard';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ─── SVG Icons (no emoji) ─────────────────────────────────────────────────────

/** Clock / timer icon */
function ClockIcon() {
  return (
    <View style={metaIcon.wrapper}>
      <View style={metaIcon.circle} />
      <View style={metaIcon.hourHand} />
      <View style={metaIcon.minuteHand} />
    </View>
  );
}

/** Person / servings icon */
function PersonIcon() {
  return (
    <View style={metaIcon.wrapper}>
      <View style={metaIcon.head} />
      <View style={metaIcon.body} />
    </View>
  );
}

/** Chart bars / difficulty icon */
function DifficultyIcon() {
  return (
    <View style={[metaIcon.wrapper, { flexDirection: 'row', alignItems: 'flex-end', gap: 2 }]}>
      <View style={{ width: 3, height: 5, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.85)' }} />
      <View style={{ width: 3, height: 9, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.85)' }} />
      <View style={{ width: 3, height: 13, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.85)' }} />
    </View>
  );
}

/** Refresh / try-again icon */
function RefreshIcon() {
  return (
    <View style={refresh.wrapper}>
      {/* Circular arrow arc */}
      <View style={refresh.arc} />
      {/* Arrowhead */}
      <View style={refresh.arrow} />
    </View>
  );
}

const metaIcon = StyleSheet.create({
  wrapper: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  hourHand: {
    position: 'absolute',
    width: 1.5,
    height: 4,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    bottom: 7,
    left: '50%',
    marginLeft: -0.75,
    transformOrigin: 'bottom',
  },
  minuteHand: {
    position: 'absolute',
    width: 1.5,
    height: 4,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    bottom: 7,
    left: '50%',
    marginLeft: 0.5,
    transform: [{ rotate: '60deg' }],
  },
  head: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginBottom: 1,
  },
  body: {
    width: 11,
    height: 6,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});

const refresh = StyleSheet.create({
  wrapper: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arc: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: COLORS.accentPrimary,
    borderTopColor: 'transparent',
  },
  arrow: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.accentPrimary,
    transform: [{ rotate: '30deg' }],
  },
});

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetaItem({ Icon, label }) {
  return (
    <View style={metaStyles.item}>
      <Icon />
      <Text style={metaStyles.text}>{label}</Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  text: {
    fontSize: TYPOGRAPHY.sectionHeaderSize,
    fontWeight: '500',
    fontFamily: FONTS.interMedium,
    color: 'rgba(255,255,255,0.92)',
  },
});

function SectionHeader({ label }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.label}>{label}</Text>
      <View style={sectionStyles.divider} />
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.base,
    gap: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.microSize,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.accentPrimary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
  },
});

function IngredientRow({ quantity, unit, name }) {
  const quantityStr = [quantity, unit].filter(Boolean).join(' ');
  return (
    <View style={ingStyles.row}>
      <View style={ingStyles.bullet} />
      <Text style={ingStyles.text}>
        {quantityStr ? (
          <Text style={ingStyles.bold}>{quantityStr} </Text>
        ) : null}
        {name}
      </Text>
    </View>
  );
}

const ingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentSecondary,
    marginTop: 8,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: TYPOGRAPHY.bodySize,
    color: COLORS.textPrimary,
    lineHeight: 22,
    fontWeight: '400',
    fontFamily: FONTS.interRegular,
  },
  bold: {
    fontWeight: '600',
    fontFamily: FONTS.interSemiBold,
  },
});

// ─── Main RecipeCard ──────────────────────────────────────────────────────────

/**
 * RecipeCard — full recipe display with slide-up spring animation.
 * PRD §6.5
 *
 * Props:
 *   recipe: object      — parsed recipe from Groq (JSON schema)
 *   onReset: () => void — resets to input state
 */
export function RecipeCard({ recipe, onReset }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // §7.4 — Success haptic when recipe appears
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 14,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  if (!recipe) return null;

  const { title, cook_time, servings, difficulty, ingredients = [], steps = [], tips } = recipe;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {/* ── Gradient Header ── */}
        <View style={styles.headerCard}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>RECIPE</Text>
            <Pressable
              onPress={onReset}
              style={styles.closeRecipeBtn}
              accessibilityLabel="Close recipe"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View style={styles.closeIconWrapper}>
                <View style={[styles.closeLine, { transform: [{ rotate: '45deg' }] }]} />
                <View style={[styles.closeLine, { transform: [{ rotate: '-45deg' }] }]} />
              </View>
            </Pressable>
          </View>
          <Text style={styles.recipeTitle}>{title}</Text>

          {/* Meta row */}
          {(cook_time || servings || difficulty) ? (
            <View style={styles.metaRow}>
              {cook_time ? <MetaItem Icon={ClockIcon} label={cook_time} /> : null}
              {servings  ? <MetaItem Icon={PersonIcon} label={`${servings} servings`} /> : null}
              {difficulty ? <MetaItem Icon={DifficultyIcon} label={difficulty} /> : null}
            </View>
          ) : null}
        </View>

        {/* ── Body Card ── */}
        <View style={styles.bodyCard}>

          {/* Ingredients */}
          {ingredients.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader label="Ingredients" />
              {ingredients.map((item, i) => {
                // Handle both object {quantity, unit, name} and plain string
                if (typeof item === 'string') {
                  return <IngredientRow key={i} name={item} />;
                }
                return (
                  <IngredientRow
                    key={i}
                    quantity={item.quantity}
                    unit={item.unit}
                    name={item.name}
                  />
                );
              })}
            </View>
          ) : null}

          {/* Steps */}
          {steps.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader label="How to Cook" />
              {steps.map((step, i) => {
                if (typeof step === 'string') {
                  return (
                    <RecipeStep
                      key={i}
                      stepNumber={i + 1}
                      instruction={step}
                    />
                  );
                }
                return (
                  <RecipeStep
                    key={i}
                    stepNumber={step.step_number ?? i + 1}
                    title={step.title}
                    instruction={step.instruction}
                  />
                );
              })}
            </View>
          ) : null}

          {/* Chef's Tip */}
          <TipCard tip={tips} />

          {/* Cook Something Else */}
          <Pressable
            onPress={onReset}
            style={({ pressed }) => [
              styles.resetBtn,
              pressed && styles.resetBtnPressed,
            ]}
            accessibilityLabel="Cook something else"
            accessibilityRole="button"
          >
            <View style={styles.resetBtnInner}>
              <RefreshIcon />
              <Text style={styles.resetBtnText}>Cook Something Else</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: SPACING.xl,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header gradient card
  headerCard: {
    borderTopLeftRadius: RADIUS.card,
    borderTopRightRadius: RADIUS.card,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: COLORS.accentPrimary,
    padding: SPACING.xl,
    gap: SPACING.sm,
    // Simulate gradient with a secondary overlay approach
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeRecipeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -SPACING.xs,
    marginTop: -SPACING.xs,
  },
  closeIconWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
  },
  eyebrow: {
    fontSize: TYPOGRAPHY.smallSize,
    fontWeight: '600',
    fontFamily: FONTS.interSemiBold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  recipeTitle: {
    fontSize: TYPOGRAPHY.recipeTitleSize,
    fontWeight: '700',
    fontFamily: FONTS.playfairSemiBold,
    color: COLORS.textOnAccent,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.base,
    marginTop: SPACING.xs,
  },

  // Body card
  bodyCard: {
    backgroundColor: COLORS.bgCard,
    borderBottomLeftRadius: RADIUS.card,
    borderBottomRightRadius: RADIUS.card,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    padding: SPACING.xl,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  section: {
    marginBottom: SPACING.xl,
  },

  // Reset button
  resetBtn: {
    marginTop: SPACING.xl,
    borderWidth: 1.5,
    borderColor: COLORS.accentPrimary,
    borderRadius: RADIUS.button,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnPressed: {
    backgroundColor: '#FFF5F0',
  },
  resetBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resetBtnText: {
    fontSize: TYPOGRAPHY.buttonSize,
    fontWeight: '600',
    fontFamily: FONTS.interSemiBold,
    color: COLORS.accentPrimary,
  },
});