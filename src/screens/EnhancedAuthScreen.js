import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
  Portal,
  Modal,
  List,
  Divider,
} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import DocumentPicker from 'react-native-document-picker';
import { useAuth } from '../contexts/AuthContext';
import { theme, commonStyles } from '../styles/theme';

export default function EnhancedAuthScreen() {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'otp-login', 'otp-verify'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    uniqueId: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    userType: 'entrepreneur',
    businessType: 'startup',
    businessName: '',
    location: {
      city: '',
      country: '',
    },
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);

  const { login, register, loginWithOTP, verifyOTP, isLoading: authLoading, error, clearError } = useAuth();

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
    if (authMode === 'login' || authMode === 'otp-login') {
      if (!formData.email) {
        showMessage('Email is required');
        return false;
      }
      if (authMode === 'login' && !formData.password) {
        showMessage('Password is required');
        return false;
      }
      if (authMode === 'otp-login' && !formData.uniqueId) {
        showMessage('Unique ID is required');
        return false;
      }
    }

    if (authMode === 'register') {
      if (!formData.email || !formData.password || !formData.firstName || 
          !formData.lastName || !formData.phoneNumber || !formData.dateOfBirth) {
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

    if (authMode === 'otp-verify') {
      if (!otpCode || otpCode.length !== 6) {
        showMessage('Please enter a valid 6-digit OTP');
        return false;
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
    setIsLoading(true);

    try {
      let result;

      switch (authMode) {
        case 'login':
          result = await login(formData.email, formData.password);
          break;
        case 'register':
          result = await register(formData);
          if (result.success) {
            showMessage('Account created successfully! Check your email for your Unique ID.');
            setAuthMode('login');
          }
          break;
        case 'otp-login':
          result = await loginWithOTP(formData.email, formData.uniqueId);
          if (result.success) {
            setAuthMode('otp-verify');
            showMessage('OTP sent to your email');
          }
          break;
        case 'otp-verify':
          result = await verifyOTP(formData.email, formData.uniqueId, otpCode);
          break;
        default:
          break;
      }

      if (result && !result.success) {
        showMessage(result.error || 'Operation failed');
      }
    } catch (error) {
      showMessage(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });

      const newDocument = {
        id: Date.now(),
        type: selectedDocumentType,
        name: result[0].name,
        size: result[0].size,
        uri: result[0].fileCopyUri,
        uploadedAt: new Date(),
      };

      setDocuments(prev => [...prev, newDocument]);
      setShowDocumentModal(false);
      setSelectedDocumentType(null);
      showMessage('Document uploaded successfully');
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        showMessage('Error uploading document');
      }
    }
  };

  const getRequiredDocuments = (userType) => {
    const docs = {
      entrepreneur: [
        { type: 'business_registration', name: 'Business Registration', required: true },
        { type: 'pitch_deck', name: 'Pitch Deck', required: true },
        { type: 'passport', name: 'Passport/ID', required: true }
      ],
      investor: [
        { type: 'proof_of_funds', name: 'Proof of Funds', required: true },
        { type: 'intent_letter', name: 'Intent Letter', required: true },
        { type: 'passport', name: 'Passport/ID', required: true }
      ],
      both: [
        { type: 'business_registration', name: 'Business Registration', required: false },
        { type: 'pitch_deck', name: 'Pitch Deck', required: false },
        { type: 'proof_of_funds', name: 'Proof of Funds', required: true },
        { type: 'intent_letter', name: 'Intent Letter', required: true },
        { type: 'passport', name: 'Passport/ID', required: true }
      ]
    };
    return docs[userType] || [];
  };

  const renderLoginForm = () => (
    <>
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

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={isLoading || authLoading}
        contentStyle={styles.submitButtonContent}
      >
        {isLoading || authLoading ? (
          <ActivityIndicator size="small" color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.submitButtonText}>Sign In</Text>
        )}
      </Button>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <Button
        mode="outlined"
        onPress={() => setAuthMode('otp-login')}
        style={styles.otpButton}
        contentStyle={styles.submitButtonContent}
      >
        <Text style={styles.otpButtonText}>Login with Unique ID + OTP</Text>
      </Button>
    </>
  );

  const renderOTPLoginForm = () => (
    <>
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
        label="Unique ID"
        value={formData.uniqueId}
        onChangeText={(text) => handleInputChange('uniqueId', text.toUpperCase())}
        style={styles.input}
        mode="outlined"
        autoCapitalize="characters"
        placeholder="SL1234567890ABC"
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={isLoading || authLoading}
        contentStyle={styles.submitButtonContent}
      >
        {isLoading || authLoading ? (
          <ActivityIndicator size="small" color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.submitButtonText}>Send OTP</Text>
        )}
      </Button>

      <Button
        mode="text"
        onPress={() => setAuthMode('login')}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Back to Password Login</Text>
      </Button>
    </>
  );

  const renderOTPVerifyForm = () => (
    <>
      <View style={styles.otpInfo}>
        <Text style={styles.otpInfoText}>
          We've sent a 6-digit code to:
        </Text>
        <Text style={styles.otpEmail}>{formData.email}</Text>
      </View>

      <TextInput
        label="Enter 6-digit OTP"
        value={otpCode}
        onChangeText={setOtpCode}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        maxLength={6}
        placeholder="123456"
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={isLoading || authLoading}
        contentStyle={styles.submitButtonContent}
      >
        {isLoading || authLoading ? (
          <ActivityIndicator size="small" color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.submitButtonText}>Verify OTP</Text>
        )}
      </Button>

      <Button
        mode="text"
        onPress={() => setAuthMode('otp-login')}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Back to OTP Login</Text>
      </Button>
    </>
  );

  const renderRegistrationForm = () => (
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
        label="Email"
        value={formData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
      />

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

      {/* Business Type Selection */}
      <Text style={styles.sectionTitle}>I am a:</Text>
      <RadioButton.Group
        onValueChange={(value) => handleInputChange('businessType', value)}
        value={formData.businessType}
      >
        <View style={styles.radioOption}>
          <RadioButton value="startup" />
          <View style={styles.radioContent}>
            <Text style={styles.radioTitle}>Startup</Text>
            <Text style={styles.radioSubtitle}>
              I have a new business idea and need funding
            </Text>
          </View>
        </View>
        <View style={styles.radioOption}>
          <RadioButton value="business" />
          <View style={styles.radioContent}>
            <Text style={styles.radioTitle}>Business</Text>
            <Text style={styles.radioSubtitle}>
              I have an existing business and need investment
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
      </RadioButton.Group>

      {formData.businessType !== 'investor' && (
        <TextInput
          label="Business/Startup Name"
          value={formData.businessName}
          onChangeText={(text) => handleInputChange('businessName', text)}
          style={styles.input}
          mode="outlined"
        />
      )}

      {/* User Type Selection */}
      <Text style={styles.sectionTitle}>Account Type:</Text>
      <RadioButton.Group
        onValueChange={(value) => handleInputChange('userType', value)}
        value={formData.userType}
      >
        <View style={styles.radioOption}>
          <RadioButton value="entrepreneur" />
          <View style={styles.radioContent}>
            <Text style={styles.radioTitle}>Entrepreneur</Text>
            <Text style={styles.radioSubtitle}>
              I create startups and need funding
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

      <TextInput
        label="Password"
        value={formData.password}
        onChangeText={(text) => handleInputChange('password', text)}
        style={styles.input}
        mode="outlined"
        secureTextEntry
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        mode="outlined"
        secureTextEntry
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={isLoading || authLoading}
        contentStyle={styles.submitButtonContent}
      >
        {isLoading || authLoading ? (
          <ActivityIndicator size="small" color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.submitButtonText}>Create Account</Text>
        )}
      </Button>
    </>
  );

  const renderForm = () => {
    switch (authMode) {
      case 'login':
        return renderLoginForm();
      case 'register':
        return renderRegistrationForm();
      case 'otp-login':
        return renderOTPLoginForm();
      case 'otp-verify':
        return renderOTPVerifyForm();
      default:
        return renderLoginForm();
    }
  };

  const getTitle = () => {
    switch (authMode) {
      case 'login':
        return 'Welcome back! Sign in to continue';
      case 'register':
        return 'Join the startup investment revolution';
      case 'otp-login':
        return 'Login with Unique ID + OTP';
      case 'otp-verify':
        return 'Enter your verification code';
      default:
        return 'Welcome to StartupLink';
    }
  };

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
            <Text style={styles.subtitle}>{getTitle()}</Text>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Card.Content>
              {/* Toggle Buttons - Only show for login/register */}
              {(authMode === 'login' || authMode === 'register') && (
                <View style={styles.toggleContainer}>
                  <Button
                    mode={authMode === 'login' ? 'contained' : 'outlined'}
                    onPress={() => setAuthMode('login')}
                    style={[styles.toggleButton, authMode === 'login' && styles.activeToggle]}
                    compact
                  >
                    Sign In
                  </Button>
                  <Button
                    mode={authMode === 'register' ? 'contained' : 'outlined'}
                    onPress={() => setAuthMode('register')}
                    style={[styles.toggleButton, authMode === 'register' && styles.activeToggle]}
                    compact
                  >
                    Sign Up
                  </Button>
                </View>
              )}

              {renderForm()}

              {/* Footer Text - Only show for login/register */}
              {(authMode === 'login' || authMode === 'register') && (
                <Text style={styles.footerText}>
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <Text
                    style={styles.linkText}
                    onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Document Upload Modal */}
      <Portal>
        <Modal
          visible={showDocumentModal}
          onDismiss={() => setShowDocumentModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Upload Document</Text>
          <Text style={styles.modalSubtitle}>
            Select document type and upload your file
          </Text>
          
          <View style={styles.documentTypes}>
            {getRequiredDocuments(formData.userType).map((doc) => (
              <Chip
                key={doc.type}
                selected={selectedDocumentType === doc.type}
                onPress={() => setSelectedDocumentType(doc.type)}
                style={styles.documentChip}
                mode="outlined"
              >
                {doc.name}
              </Chip>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowDocumentModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleDocumentUpload}
              disabled={!selectedDocumentType}
              style={styles.modalButton}
            >
              Upload
            </Button>
          </View>
        </Modal>
      </Portal>

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
  otpButton: {
    marginTop: theme.spacing.md,
    borderColor: theme.colors.primary,
  },
  otpButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  backButton: {
    marginTop: theme.spacing.sm,
  },
  backButtonText: {
    color: theme.colors.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outline,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  otpInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  otpInfoText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  otpEmail: {
    ...theme.typography.subtitle2,
    color: theme.colors.primary,
    fontWeight: '500',
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
  modalContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness,
  },
  modalTitle: {
    ...theme.typography.h6,
    marginBottom: theme.spacing.sm,
  },
  modalSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  documentTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
  },
  documentChip: {
    margin: theme.spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});