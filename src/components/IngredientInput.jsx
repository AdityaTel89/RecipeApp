import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * IngredientInput — purely a UI component.
 * Owns only the local text state (what's typed right now).
 * Everything else — loading state, submission — comes from props.
 *
 * Props:
 *   onSubmit(value: string) — called when user taps the button
 *   isLoading: boolean      — disables button while API is in flight
 *   error: string | null    — displays validation or API error
 */
export function IngredientInput({ onSubmit, isLoading, error }) {
  const [inputValue, setInputValue] = useState('');

  function handlePress() {
    onSubmit(inputValue);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>What ingredients do you have?</Text>
      <Text style={styles.hint}>Separate with commas, e.g. chicken, garlic, soy sauce</Text>

      <TextInput
        style={styles.input}
        value={inputValue}
        onChangeText={setInputValue}
        placeholder="chicken, broccoli, soy sauce, rice"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        returnKeyType="done"
        onSubmitEditing={handlePress}
      />

      {/* Error message sits between input and button */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Finding recipe...' : 'Generate Recipe'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#e05252',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  button: {
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: '#a0b8af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});