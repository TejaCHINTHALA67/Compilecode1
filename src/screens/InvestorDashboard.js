import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { commonStyles, theme } from '../styles/theme';

export default function InvestorDashboard() {
  return (
    <View style={[commonStyles.container, commonStyles.centerContent]}>
      <Text style={styles.title}>Investment Portfolio</Text>
      <Text style={styles.subtitle}>Dashboard coming soon</Text>
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
