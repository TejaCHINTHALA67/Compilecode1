import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  IconButton,
  ProgressBar,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { startupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles, theme } from '../styles/theme';
import AIInsights from '../components/AIInsights';

// const { width: screenWidth } = Dimensions.get('window');

export default function StartupDetailScreen({ route, navigation }) {
  const { startupId } = route.params || {};
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (startupId) {
      loadStartupDetails();
    }
  }, [startupId, loadStartupDetails]);

  const loadStartupDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await startupsAPI.getById(startupId, token);
      setStartup(response.data || response);
    } catch (err) {
      // console.error('Error loading startup details:', err);
      setError('Failed to load startup details');
    } finally {
      setLoading(false);
    }
  }, [startupId, token]);

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSectorColor = (sector) => {
    const colors = {
      'Technology': '#4CAF50',
      'Healthcare': '#2196F3',
      'Finance': '#FF9800',
      'Education': '#9C27B0',
      'E-commerce': '#F44336',
      'Entertainment': '#E91E63',
      'Food & Beverage': '#795548',
      'Travel': '#607D8B',
      'Real Estate': '#3F51B5',
    };
    return colors[sector] || '#757575';
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading startup details...</Text>
      </View>
    );
  }

  if (error || !startup) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <Icon name="error-outline" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>Startup Not Found</Text>
        <Text style={styles.errorText}>{error || 'This startup could not be loaded'}</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with background */}
      <LinearGradient
        colors={[getSectorColor(startup.sector) + '20', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Image
            source={{ uri: startup.logo || 'https://via.placeholder.com/100' }}
            style={styles.startupLogo}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.startupName}>{startup.name}</Text>
            <Text style={styles.startupTagline}>{startup.tagline}</Text>
            <View style={styles.headerMeta}>
              <Chip
                mode="flat"
                style={[styles.sectorChip, { backgroundColor: getSectorColor(startup.sector) + '20' }]}
                textStyle={{ color: getSectorColor(startup.sector), fontSize: 12 }}
              >
                {startup.sector}
              </Chip>
              <Chip mode="outlined" style={styles.stageChip}>
                {startup.stage}
              </Chip>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Description */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{startup.description}</Text>
          </Card.Content>
        </Card>

        {/* Funding Progress */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Funding Progress</Text>
            <View style={styles.fundingInfo}>
              <View style={styles.fundingHeader}>
                <Text style={styles.fundingAmount}>
                  {formatCurrency(startup.funding?.currentAmount || 0, startup.funding?.currency)}
                </Text>
                <Text style={styles.fundingTarget}>
                  of {formatCurrency(startup.funding?.targetAmount || 0, startup.funding?.currency)}
                </Text>
              </View>
              <ProgressBar
                progress={(startup.funding?.currentAmount || 0) / (startup.funding?.targetAmount || 1)}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
              <View style={styles.fundingStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{startup.funding?.investorCount || 0}</Text>
                  <Text style={styles.statLabel}>Investors</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{startup.daysRemaining || 0}</Text>
                  <Text style={styles.statLabel}>Days Left</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round(((startup.funding?.currentAmount || 0) / (startup.funding?.targetAmount || 1)) * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Funded</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Team */}
        {startup.founder && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Founder</Text>
              <View style={styles.founderInfo}>
                <Image
                  source={{ uri: startup.founder.profilePicture || 'https://via.placeholder.com/60' }}
                  style={styles.founderAvatar}
                />
                <View style={styles.founderDetails}>
                  <Text style={styles.founderName}>
                    {startup.founder.firstName} {startup.founder.lastName}
                  </Text>
                  <Text style={styles.founderBio}>{startup.founder.bio}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Location */}
        {startup.location && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationInfo}>
                <Icon name="location-on" size={20} color={theme.colors.primary} />
                <Text style={styles.locationText}>
                  {startup.location.city}, {startup.location.country}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* AI Insights for Investors */}
        {(user?.userType === 'investor' || user?.userType === 'both') && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.aiInsightsHeader}>
                <Icon name="psychology" size={24} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>AI Investment Analysis</Text>
              </View>
              <Text style={styles.aiInsightsDescription}>
                Get AI-powered insights about this startup's investment potential and similar investor profiles.
              </Text>
              <AIInsights
                targetId={startup._id}
                targetType="startup"
                analysisType="investor_analysis"
                buttonText="🤖 Analyze Investment Potential"
                buttonStyle={styles.aiInsightsButton}
              />
            </Card.Content>
          </Card>
        )}

        {/* Investment Action */}
        {(user?.userType === 'investor' || user?.userType === 'both') && (
          <Card style={styles.investmentCard}>
            <Card.Content>
              <Text style={styles.investmentTitle}>Ready to Invest?</Text>
              <Text style={styles.investmentSubtitle}>
                Join {startup.funding?.investorCount || 0} other investors backing this startup
              </Text>
              <Button
                mode="contained"
                style={styles.investButton}
                onPress={() => {
                  // Navigate to investment flow
                  // console.log('Navigate to investment flow for:', startup._id);
                }}
              >
                Invest Now
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* View Only for Entrepreneurs */}
        {user?.userType === 'entrepreneur' && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.entrepreneurInfo}>
                <Icon name="lightbulb" size={24} color={theme.colors.warning} />
                <Text style={styles.entrepreneurText}>
                  Viewing as an entrepreneur. Investment features are available for investors.
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginVertical: 16,
  },
  backButton: {
    marginTop: 16,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  startupLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  startupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  startupTagline: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  headerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectorChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  stageChip: {
    marginBottom: 4,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.onSurface,
  },
  fundingInfo: {
    marginTop: 8,
  },
  fundingHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  fundingAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 8,
  },
  fundingTarget: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  fundingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  founderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  founderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  founderDetails: {
    flex: 1,
  },
  founderName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  founderBio: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiInsightsDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  aiInsightsButton: {
    borderColor: theme.colors.primary,
  },
  investmentCard: {
    marginBottom: 16,
    elevation: 3,
    backgroundColor: theme.colors.primaryContainer,
  },
  investmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onPrimaryContainer,
    marginBottom: 8,
  },
  investmentSubtitle: {
    fontSize: 14,
    color: theme.colors.onPrimaryContainer,
    marginBottom: 16,
  },
  investButton: {
    backgroundColor: theme.colors.primary,
  },
  entrepreneurInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.warningContainer,
    borderRadius: 8,
  },
  entrepreneurText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.onWarningContainer,
  },
});