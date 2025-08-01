import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles, theme } from '../styles/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={[commonStyles.container, styles.container]}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.userType}>User Type: {user?.userType}</Text>
      </View>
      
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={logout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.lg,
  },
  name: {
    ...theme.typography.h5,
    marginBottom: theme.spacing.sm,
  },
  email: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  userType: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  footer: {
    paddingBottom: theme.spacing.xl,
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
  },
});