import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipeGenerator } from '../hooks/useRecipeGenerator';
import { IngredientInput } from '../components/IngredientInput';
import { RecipeCard } from '../components/RecipeCard';

export function HomeScreen() {
  const { recipe, isLoading, error, generateRecipe } = useRecipeGenerator();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.appTitle}>Smart Recipe</Text>
        <Text style={styles.appSubtitle}>
          Turn what's in your kitchen into a meal
        </Text>

        <IngredientInput
          onSubmit={generateRecipe}
          isLoading={isLoading}
          error={error}
        />

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2d6a4f" />
            <Text style={styles.loaderText}>Cooking up something good...</Text>
          </View>
        ) : null}

        {!isLoading && recipe ? (
          <RecipeCard recipe={recipe} />
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f0',
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    marginTop: 8,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  loaderContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#888',
  },
});