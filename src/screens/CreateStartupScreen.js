import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { commonStyles, theme } from '../styles/theme';

export default function CreateStartupScreen() {
  return (
    <View style={[commonStyles.container, commonStyles.centerContent]}>
      <Text style={styles.title}>Create Your Startup</Text>
      <Text style={styles.subtitle}>Pitch builder coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
});