import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRecipeGenerator, getConfiguredProviders } from '../hooks/useRecipeGenerator';
import { Header }          from '../components/Header';
import { IngredientInput } from '../components/IngredientInput';
import { GenerateButton }  from '../components/GenerateButton';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { RecipeCard }      from '../components/RecipeCard';
import { ErrorToast }      from '../components/ErrorToast';
import { COLORS, SPACING, FONTS, SUGGESTED_RECIPES } from '../config/constants';

const configuredProviders = getConfiguredProviders();
const KEY_MISSING = __DEV__ && configuredProviders.length === 0;


function DevKeyBanner() {
  return (
    <View style={bannerStyles.banner}>
      <Text style={bannerStyles.text}>
        ⚙️  No API key found. Add one or more to your .env:{`\n`}
        EXPO_PUBLIC_OPENAI_KEY · EXPO_PUBLIC_GROQ_KEY · EXPO_PUBLIC_GEMINI_KEY · EXPO_PUBLIC_CLAUDE_KEY
      </Text>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#7B3F00',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    zIndex: 1000,
  },
  text: {
    color: '#FFE4B5',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});


function SuggestedRecipes({ onSelectRecipe }) {
  return (
    <View style={sugStyles.container}>
      <Text style={sugStyles.heading}>INSTANT SUGGESTED RECIPES</Text>
      <View style={sugStyles.list}>
        {SUGGESTED_RECIPES.map((recipe, index) => (
          <Pressable
            key={index}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onSelectRecipe(recipe);
            }}
            style={({ pressed }) => [
              sugStyles.card,
              pressed && sugStyles.cardPressed
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Instant recipe: ${recipe.title}. Cook time: ${recipe.cook_time}. Difficulty: ${recipe.difficulty}`}
          >
            <View style={sugStyles.cardHeader}>
              <Text style={sugStyles.title}>{recipe.title}</Text>
              <View style={[
                sugStyles.difficultyBadge,
                recipe.difficulty === 'Easy' ? sugStyles.easyBadge : sugStyles.mediumBadge
              ]}>
                <Text style={sugStyles.badgeText}>{recipe.difficulty}</Text>
              </View>
            </View>
            <Text style={sugStyles.desc}>{recipe.description}</Text>
            <Text style={sugStyles.meta}>⏱ {recipe.cook_time}  ·  👤 {recipe.servings} servings</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const sugStyles = StyleSheet.create({
  container: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginBottom: SPACING.md,
  },
  list: {
    gap: SPACING.base,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: '#FFFBF7',
    borderColor: COLORS.accentSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  desc: {
    fontSize: 13,
    fontFamily: FONTS.interRegular,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  meta: {
    fontSize: 12,
    fontFamily: FONTS.interMedium,
    color: COLORS.accentPrimary,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  easyBadge: {
    backgroundColor: '#E6F4EA',
  },
  mediumBadge: {
    backgroundColor: '#FEF3D6',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textPrimary,
  },
});


function ServingsSelector({ servings, onChange }) {
  const options = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <View style={servStyles.container}>
      <Text style={servStyles.label}>NUMBER OF SERVINGS</Text>
      <View style={servStyles.row}>
        {options.map((val) => {
          const isSelected = servings === val;
          return (
            <Pressable
              key={val}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onChange(val);
              }}
              style={({ pressed }) => [
                servStyles.circle,
                isSelected && servStyles.circleSelected,
                pressed && !isSelected && servStyles.circlePressed
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${val} serving${val === 1 ? '' : 's'}`}
              accessibilityState={{ selected: isSelected }}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={[
                servStyles.circleText,
                isSelected && servStyles.circleTextSelected
              ]}>
                {val}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const servStyles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    borderRadius: 14,
    padding: SPACING.sm,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgBase,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: {
    backgroundColor: COLORS.accentPrimary,
    borderColor: COLORS.accentPrimary,
  },
  circlePressed: {
    backgroundColor: '#FFF0E6',
    borderColor: COLORS.accentSecondary,
  },
  circleText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.interBold,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  circleTextSelected: {
    color: '#FFFFFF',
  },
});


export function HomeScreen() {
  const {
    appState,
    recipe,
    error,
    isErrorRetryable,
    generateRecipe,
    retryLast,
    resetToInput,
    dismissError,
    loadSuggestedRecipe,
  } = useRecipeGenerator();

  // Local ingredient list tracked from IngredientInput
  const [ingredients, setIngredients] = useState([]);

  // User-specified serving size
  const [servings, setServings] = useState(2);

  // shake signal: toggled to a new value each time a shake is needed
  const [shakeKey, setShakeKey] = useState(false);

  // Fade animators for state transitions
  const inputFade    = useRef(new Animated.Value(1)).current;
  const skeletonFade = useRef(new Animated.Value(0)).current;

  // Track previous appState so we can detect the loading → input error transition
  const prevAppStateRef = useRef(appState);


  useEffect(() => {
    if (prevAppStateRef.current === 'loading' && appState === 'input') {
      Animated.timing(inputFade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      Animated.timing(skeletonFade, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
    prevAppStateRef.current = appState;
  }, [appState, inputFade, skeletonFade]);

  const handleIngredientsChange = useCallback((parsed) => {
    setIngredients(parsed);
  }, []);

  const handleGenerate = useCallback(() => {
    // shake on empty input (0 ingredients)
    if (ingredients.length === 0) {
      setShakeKey(prev => !prev);
      return;
    }

    // Crossfade: input out → skeleton in
    Animated.parallel([
      Animated.timing(inputFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(skeletonFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    generateRecipe(ingredients, servings);
  }, [ingredients, servings, generateRecipe, inputFade, skeletonFade]);


  const handleDismissError = useCallback(() => {
    if (!isErrorRetryable) {
      // Clear the bad ingredients — user needs to start fresh
      setIngredients([]);
    }
    dismissError();
  }, [isErrorRetryable, dismissError]);

  const handleReset = useCallback(() => {
    // Restore input fade
    Animated.timing(inputFade, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    Animated.timing(skeletonFade, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();

    setIngredients([]);
    setServings(2); // Reset servings to default 2
    resetToInput();
  }, [resetToInput, inputFade, skeletonFade]);

  const isLoading  = appState === 'loading';
  const showResult = appState === 'result' && recipe;

  // disabled only at 0 ingredients; 1 ingredient shows warning badge but is enabled
  const isDisabled = ingredients.length === 0 || isLoading;
  const isWarning  = ingredients.length === 1 && !isLoading;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Dev-mode API key missing persistent banner */}
      {KEY_MISSING ? <DevKeyBanner /> : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Error toast — renders above everything */}
        {error ? (
          <ErrorToast
            message={error}
            onDismiss={handleDismissError}
            onRetry={isErrorRetryable ? retryLast : null}
          />
        ) : null}

        {showResult ? (
          /* ── RESULT STATE ── */
          <View style={styles.flex}>
            <View style={styles.resultHeader}>
              <Header />
            </View>
            <RecipeCard recipe={recipe} onReset={handleReset} />
          </View>
        ) : (
          /* ── INPUT + LOADING STATES ── */
          <View style={styles.flex}>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Header />

              {/* Input state fades out when loading */}
              {!isLoading ? (
                <Animated.View style={{ opacity: inputFade }}>
                  <IngredientInput
                    onIngredientsChange={handleIngredientsChange}
                    isLoading={isLoading}
                    shake={shakeKey}
                    ingredients={ingredients}
                    setIngredients={setIngredients}
                  />

                  {/* Servings selector sits under input */}
                  <ServingsSelector servings={servings} onChange={setServings} />
                </Animated.View>
              ) : null}

              {/* Predefined instant recipes suggestion */}
              {!isLoading ? (
                <SuggestedRecipes onSelectRecipe={loadSuggestedRecipe} />
              ) : null}

              {/* Loading skeleton fades in */}
              {isLoading ? (
                <Animated.View style={{ opacity: skeletonFade }}>
                  <LoadingSkeleton />
                </Animated.View>
              ) : null}
            </ScrollView>

            {/* Generate button — always visible above keyboard */}
            {!isLoading ? (
              <View style={styles.buttonContainer}>
                <GenerateButton
                  onPress={handleGenerate}
                  disabled={isDisabled}
                  isWarning={isWarning}
                  isLoading={false}
                />
              </View>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 120, // Extra spacing so content is scrollable above the floating button
  },
  resultHeader: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.base,
    backgroundColor: COLORS.bgBase,
  },
});