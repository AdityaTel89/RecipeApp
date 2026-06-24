import { View, Text, StyleSheet } from 'react-native';

export function RecipeCard({ recipe }) {
  if (!recipe) return null;

  return (
    <View style={styles.card}>

      <Text style={styles.title}>{recipe.title}</Text>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Ingredients</Text>
      {recipe.ingredients.map((item, index) => (
        <View key={index} style={styles.ingredientRow}>
          <View style={styles.bullet} />
          <Text style={styles.ingredientText}>{item}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Steps</Text>
      {recipe.steps.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <Text style={styles.stepNumber}>{index + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    lineHeight: 28,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d6a4f',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2d6a4f',
    marginTop: 7,
    marginRight: 10,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#eaf4ef',
    color: '#2d6a4f',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginRight: 12,
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});