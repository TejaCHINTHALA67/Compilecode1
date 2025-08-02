import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ProgressBar,
  ActivityIndicator,
  IconButton,
  Badge,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { recommendationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { theme, commonStyles } from '../styles/theme';

export default function AIRecommendationsScreen({ navigation }) {
  const [recommendations, setRecommendations] = useState([]);
  const [trendingSectors, setTrendingSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingScores, setUpdatingScores] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    loadRecommendations();
    loadTrendingSectors();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await recommendationsAPI.getStartupRecommendations({ limit: 10 }, token);
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      Alert.alert('Error', 'Failed to load AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingSectors = async () => {
    try {
      const response = await recommendationsAPI.getTrendingSectors(token);
      setTrendingSectors(response.data.sectors || []);
    } catch (error) {
      console.error('Error loading trending sectors:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRecommendations(), loadTrendingSectors()]);
    setRefreshing(false);
  };

  const handleRefreshAI = async () => {
    setUpdatingScores(true);
    try {
      await recommendationsAPI.updateAIScores(token);
      await loadRecommendations();
      Alert.alert('Success', 'AI recommendations updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update AI scores');
    } finally {
      setUpdatingScores(false);
    }
  };

  const handleInvestmentSuggestion = async (startupId) => {
    try {
      const response = await recommendationsAPI.suggestInvestment({ startupId }, token);
      const { matchScore, suggestion } = response.data;

      Alert.alert(
        '🤖 AI Investment Suggestion',
        `Match Score: ${Math.round(matchScore)}%\n\n` +
        `Suggested Amount: ${suggestion.currency} ${suggestion.amount}\n\n` +
        `Reasoning:\n${suggestion.reasoning.join('\n• ')}\n\n` +
        `Confidence: ${suggestion.confidence.toUpperCase()}`,
        [
          { text: 'View Details', onPress: () => navigation.navigate('StartupDetail', { startupId }) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate investment suggestion');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return 'trending-up';
    if (score >= 60) return 'trending-flat';
    return 'trending-down';
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>AI is analyzing perfect matches...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={commonStyles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.primary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Icon name="psychology" size={32} color="white" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>AI Recommendations</Text>
              <Text style={styles.headerSubtitle}>
                Personalized startup matches powered by AI
              </Text>
            </View>
          </View>
          <IconButton
            icon="refresh"
            size={24}
            iconColor="white"
            onPress={handleRefreshAI}
            disabled={updatingScores}
          />
        </View>
      </LinearGradient>

      {/* User Investment Profile Summary */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Your Investment Profile</Text>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                {user?.investorProfile?.preferredSectors?.length || 0}
              </Text>
              <Text style={styles.profileStatLabel}>Preferred Sectors</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                {user?.investorProfile?.riskTolerance || 'Moderate'}
              </Text>
              <Text style={styles.profileStatLabel}>Risk Tolerance</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                {formatCurrency(user?.investorProfile?.investmentCapacity || 0)}
              </Text>
              <Text style={styles.profileStatLabel}>Capacity</Text>
            </View>
          </View>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('InvestorPreferences')}
            style={styles.editPreferencesButton}
          >
            Edit Preferences
          </Button>
        </Card.Content>
      </Card>

      {/* Trending Sectors */}
      {trendingSectors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Trending Sectors</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingContainer}
          >
            {trendingSectors.map((sector, index) => (
              <Card key={sector._id} style={styles.trendingCard}>
                <Card.Content>
                  <Text style={styles.trendingSector}>{sector._id}</Text>
                  <Text style={styles.trendingAmount}>
                    {formatCurrency(sector.totalFunding)}
                  </Text>
                  <Text style={styles.trendingCount}>
                    {sector.startupCount} startups
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>
      )}

      {/* AI Recommendations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🤖 AI-Powered Matches</Text>
          <Badge style={styles.aiPoweredBadge}>AI Powered</Badge>
        </View>

        {recommendations.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="psychology" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Recommendations Yet</Text>
              <Text style={styles.emptySubtitle}>
                Update your investment preferences to get personalized AI recommendations
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('InvestorPreferences')}
                style={styles.setupButton}
              >
                Setup Preferences
              </Button>
            </Card.Content>
          </Card>
        ) : (
          recommendations.map((recommendation) => {
            const { startup, aiScore, reasons } = recommendation;
            return (
              <Card key={startup._id} style={styles.recommendationCard}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('StartupDetail', { startupId: startup._id })}
                >
                  {/* Startup Header */}
                  <View style={styles.startupHeader}>
                    <Image
                      source={{ uri: startup.logo || 'https://via.placeholder.com/60' }}
                      style={styles.startupLogo}
                    />
                    <View style={styles.startupInfo}>
                      <Text style={styles.startupName}>{startup.name}</Text>
                      <Text style={styles.startupTagline}>{startup.tagline}</Text>
                      <View style={styles.startupMeta}>
                        <Chip
                          mode="outlined"
                          style={styles.sectorChip}
                          textStyle={styles.sectorChipText}
                        >
                          {startup.sector}
                        </Chip>
                        <Text style={styles.startupStage}>{startup.stage}</Text>
                      </View>
                    </View>
                    <View style={styles.aiScoreContainer}>
                      <Icon
                        name={getScoreIcon(aiScore)}
                        size={20}
                        color={getScoreColor(aiScore)}
                      />
                      <Text style={[styles.aiScore, { color: getScoreColor(aiScore) }]}>
                        {Math.round(aiScore)}%
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  {/* AI Reasons */}
                  <View style={styles.reasonsContainer}>
                    <Text style={styles.reasonsTitle}>Why this matches you:</Text>
                    {reasons.map((reason, index) => (
                      <View key={index} style={styles.reasonItem}>
                        <Icon name="check-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.reasonText}>{reason}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Funding Progress */}
                  <View style={styles.fundingContainer}>
                    <View style={styles.fundingHeader}>
                      <Text style={styles.fundingLabel}>Funding Progress</Text>
                      <Text style={styles.fundingAmount}>
                        {formatCurrency(startup.funding?.currentAmount || 0)} / {formatCurrency(startup.funding?.targetAmount || 0)}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={(startup.funding?.currentAmount || 0) / (startup.funding?.targetAmount || 1)}
                      color={theme.colors.success}
                      style={styles.progressBar}
                    />
                    <View style={styles.fundingStats}>
                      <Text style={styles.fundingStat}>
                        Min: {formatCurrency(startup.funding?.minimumInvestment || 0)}
                      </Text>
                      <Text style={styles.fundingStat}>
                        {startup.funding?.investorCount || 0} investors
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => handleInvestmentSuggestion(startup._id)}
                    style={styles.actionButton}
                    icon="psychology"
                  >
                    AI Suggest
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('StartupDetail', {
                      startupId: startup._id,
                      showInvestModal: true
                    })}
                    style={styles.actionButton}
                  >
                    Invest Now
                  </Button>
                </View>
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: theme.spacing.md,
  },
  headerContent: {
    ...commonStyles.spaceBetween,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.h5,
    color: 'white',
    fontWeight: '700',
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: 'white',
    opacity: 0.9,
  },
  loadingText: {
    ...theme.typography.body2,
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  profileCard: {
    margin: theme.spacing.md,
    ...theme.shadows.medium,
  },
  cardTitle: {
    ...theme.typography.h6,
    marginBottom: theme.spacing.md,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    ...theme.typography.h6,
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  profileStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  editPreferencesButton: {
    marginTop: theme.spacing.sm,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    ...commonStyles.spaceBetween,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h6,
    fontWeight: '600',
  },
  aiPoweredBadge: {
    backgroundColor: theme.colors.secondary,
  },
  trendingContainer: {
    paddingRight: theme.spacing.md,
  },
  trendingCard: {
    width: 120,
    marginRight: theme.spacing.md,
    ...theme.shadows.small,
  },
  trendingSector: {
    ...theme.typography.subtitle2,
    fontWeight: '600',
    textAlign: 'center',
  },
  trendingAmount: {
    ...theme.typography.body2,
    color: theme.colors.success,
    textAlign: 'center',
    marginTop: 4,
  },
  trendingCount: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  emptyCard: {
    ...theme.shadows.medium,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h6,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  setupButton: {
    marginTop: theme.spacing.sm,
  },
  recommendationCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  startupHeader: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  startupLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: theme.spacing.md,
  },
  startupInfo: {
    flex: 1,
  },
  startupName: {
    ...theme.typography.h6,
    fontWeight: '700',
  },
  startupTagline: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.sm,
  },
  startupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectorChip: {
    height: 24,
    marginRight: theme.spacing.sm,
  },
  sectorChipText: {
    fontSize: 10,
  },
  startupStage: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  aiScoreContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
  },
  aiScore: {
    ...theme.typography.subtitle2,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    marginHorizontal: theme.spacing.md,
  },
  reasonsContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  reasonsTitle: {
    ...theme.typography.subtitle2,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  reasonText: {
    ...theme.typography.body2,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  fundingContainer: {
    padding: theme.spacing.md,
  },
  fundingHeader: {
    ...commonStyles.spaceBetween,
    marginBottom: theme.spacing.sm,
  },
  fundingLabel: {
    ...theme.typography.subtitle2,
    fontWeight: '600',
  },
  fundingAmount: {
    ...theme.typography.body2,
    color: theme.colors.success,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: theme.spacing.sm,
  },
  fundingStats: {
    ...commonStyles.spaceBetween,
  },
  fundingStat: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    paddingTop: 0,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});