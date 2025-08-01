import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  RadioButton,
  Chip,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { theme, commonStyles } from '../styles/theme';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    userType: 'entrepreneur',
    location: {
      city: '',
      country: '',
    },
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { login, register, isLoading, error, clearError } = useAuth();

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      showMessage('Email and password are required');
      return false;
    }

    if (!isLogin) {
      if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
        showMessage('Please fill in all required fields');
        return false;
      }

      if (formData.password !== confirmPassword) {
        showMessage('Passwords do not match');
        return false;
      }

      if (formData.password.length < 6) {
        showMessage('Password must be at least 6 characters');
        return false;
      }

      // Basic age validation (18+)
      if (formData.dateOfBirth) {
        const birthDate = new Date(formData.dateOfBirth);
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) {
          showMessage('You must be at least 18 years old to register');
          return false;
        }
      }
    }

    return true;
  };

  const showMessage = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    clearError();

    if (isLogin) {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        showMessage(result.error);
      }
    } else {
      const result = await register(formData);
      if (!result.success) {
        showMessage(result.error);
      }
    }
  };

  const sectors = ['AI', 'Health', 'Climate', 'EdTech', 'FinTech', 'E-commerce', 'Gaming', 'Other'];

  return (
    <LinearGradient
      colors={theme.colors.gradient.primary}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>StartupLink</Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Welcome back! Sign in to continue' 
                : 'Join the startup investment revolution'
              }
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Card.Content>
              {/* Toggle Buttons */}
              <View style={styles.toggleContainer}>
                <Button
                  mode={isLogin ? 'contained' : 'outlined'}
                  onPress={() => setIsLogin(true)}
                  style={[styles.toggleButton, isLogin && styles.activeToggle]}
                  compact
                >
                  Sign In
                </Button>
                <Button
                  mode={!isLogin ? 'contained' : 'outlined'}
                  onPress={() => setIsLogin(false)}
                  style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                  compact
                >
                  Sign Up
                </Button>
              </View>

              {/* Registration Fields */}
              {!isLogin && (
                <>
                  <View style={styles.nameRow}>
                    <TextInput
                      label="First Name"
                      value={formData.firstName}
                      onChangeText={(text) => handleInputChange('firstName', text)}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                    />
                    <TextInput
                      label="Last Name"
                      value={formData.lastName}
                      onChangeText={(text) => handleInputChange('lastName', text)}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                    />
                  </View>

                  <TextInput
                    label="Phone Number"
                    value={formData.phoneNumber}
                    onChangeText={(text) => handleInputChange('phoneNumber', text)}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="phone-pad"
                  />

                  <TextInput
                    label="Date of Birth (YYYY-MM-DD)"
                    value={formData.dateOfBirth}
                    onChangeText={(text) => handleInputChange('dateOfBirth', text)}
                    style={styles.input}
                    mode="outlined"
                    placeholder="1990-01-15"
                  />

                  <View style={styles.nameRow}>
                    <TextInput
                      label="City"
                      value={formData.location.city}
                      onChangeText={(text) => handleInputChange('location.city', text)}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                    />
                    <TextInput
                      label="Country"
                      value={formData.location.country}
                      onChangeText={(text) => handleInputChange('location.country', text)}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                    />
                  </View>

                  {/* User Type Selection */}
                  <Text style={styles.sectionTitle}>I am a:</Text>
                  <RadioButton.Group
                    onValueChange={(value) => handleInputChange('userType', value)}
                    value={formData.userType}
                  >
                    <View style={styles.radioOption}>
                      <RadioButton value="entrepreneur" />
                      <View style={styles.radioContent}>
                        <Text style={styles.radioTitle}>Entrepreneur</Text>
                        <Text style={styles.radioSubtitle}>
                          I have startup ideas and need funding
                        </Text>
                      </View>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="investor" />
                      <View style={styles.radioContent}>
                        <Text style={styles.radioTitle}>Investor</Text>
                        <Text style={styles.radioSubtitle}>
                          I want to invest in promising startups
                        </Text>
                      </View>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="both" />
                      <View style={styles.radioContent}>
                        <Text style={styles.radioTitle}>Both</Text>
                        <Text style={styles.radioSubtitle}>
                          I create startups and invest in others
                        </Text>
                      </View>
                    </View>
                  </RadioButton.Group>
                </>
              )}

              {/* Common Fields */}
              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                style={styles.input}
                mode="outlined"
                secureTextEntry
              />

              {!isLogin && (
                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                />
              )}

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                disabled={isLoading}
                contentStyle={styles.submitButtonContent}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </Button>

              {/* Footer Text */}
              <Text style={styles.footerText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Text
                  style={styles.linkText}
                  onPress={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={4000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.onPrimary,
    marginBottom: theme.spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.subtitle1,
    color: theme.colors.onPrimary,
    textAlign: 'center',
    opacity: 0.9,
  },
  formCard: {
    ...theme.shadows.large,
    marginBottom: theme.spacing.xl,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    margin: 0,
  },
  activeToggle: {
    elevation: 2,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  sectionTitle: {
    ...theme.typography.h6,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  radioContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  radioTitle: {
    ...theme.typography.subtitle2,
    fontWeight: '500',
  },
  radioSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  submitButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
  footerText: {
    ...theme.typography.body2,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  snackbar: {
    backgroundColor: theme.colors.error,
  },
});