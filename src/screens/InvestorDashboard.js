import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button, IconButton, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { investmentsAPI, recommendationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles, theme } from '../styles/theme';

export default function InvestorDashboard({ navigation }) {
  const [portfolio, setPortfolio] = useState(null);
  const [quickRecommendations, setQuickRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load portfolio and quick recommendations in parallel
      const [portfolioResponse, recommendationsResponse] = await Promise.all([
        investmentsAPI.getPortfolio(token),
        recommendationsAPI.getStartupRecommendations({ limit: 3 }, token)
      ]);

      setPortfolio(portfolioResponse.data);
      setQuickRecommendations(recommendationsResponse.data.recommendations || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.loadingText}>Loading your portfolio...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Investment Portfolio</Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={loadDashboardData}
        />
      </View>

      {/* Portfolio Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Portfolio Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatCurrency(portfolio?.totalInvested || 0)}
              </Text>
              <Text style={styles.statLabel}>Total Invested</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatCurrency(portfolio?.portfolioValue || 0)}
              </Text>
              <Text style={styles.statLabel}>Portfolio Value</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { 
                color: (portfolio?.totalReturns || 0) >= 0 ? theme.colors.success : theme.colors.error 
              }]}>
                {formatCurrency(portfolio?.totalReturns || 0)}
              </Text>
              <Text style={styles.statLabel}>Total Returns</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* AI Recommendations Quick View */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🤖 AI Recommendations</Text>
          <Button
            mode="outlined"
            compact
            onPress={() => navigation.navigate('AIRecommendations')}
          >
            View All
          </Button>
        </View>

        {quickRecommendations.length > 0 ? (
          quickRecommendations.map((recommendation) => {
            const { startup, aiScore } = recommendation;
            return (
              <TouchableOpacity
                key={startup._id}
                onPress={() => navigation.navigate('StartupDetail', { startupId: startup._id })}
              >
                <Card style={styles.recommendationCard}>
                  <Card.Content>
                    <View style={styles.recommendationHeader}>
                      <View style={styles.recommendationInfo}>
                        <Text style={styles.recommendationName}>{startup.name}</Text>
                        <Text style={styles.recommendationSector}>{startup.sector}</Text>
                      </View>
                      <View style={styles.aiScoreContainer}>
                        <Icon name="psychology" size={16} color={theme.colors.secondary} />
                        <Text style={styles.aiScoreText}>{Math.round(aiScore)}%</Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="psychology" size={32} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>Set up your preferences to get AI recommendations</Text>
              <Button
                mode="contained"
                compact
                style={styles.setupButton}
                onPress={() => navigation.navigate('InvestorPreferences')}
              >
                Setup Now
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AIRecommendations')}
          >
            <Icon name="psychology" size={32} color={theme.colors.primary} />
            <Text style={styles.actionTitle}>AI Matches</Text>
            <Text style={styles.actionSubtitle}>Find perfect startups</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Explore')}
          >
            <Icon name="explore" size={32} color={theme.colors.secondary} />
            <Text style={styles.actionTitle}>Explore</Text>
            <Text style={styles.actionSubtitle}>Browse all startups</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Portfolio')}
          >
            <Icon name="trending-up" size={32} color={theme.colors.success} />
            <Text style={styles.actionTitle}>Portfolio</Text>
            <Text style={styles.actionSubtitle}>Track investments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Icon name="analytics" size={32} color={theme.colors.warning} />
            <Text style={styles.actionTitle}>Analytics</Text>
            <Text style={styles.actionSubtitle}>View insights</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    ...commonStyles.spaceBetween,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    ...theme.typography.h5,
    fontWeight: '700',
  },
  loadingText: {
    ...theme.typography.body2,
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    margin: theme.spacing.md,
    ...theme.shadows.medium,
  },
  cardTitle: {
    ...theme.typography.h6,
    marginBottom: theme.spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h6,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
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
  recommendationCard: {
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  recommendationHeader: {
    ...commonStyles.spaceBetween,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationName: {
    ...theme.typography.subtitle2,
    fontWeight: '600',
  },
  recommendationSector: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  aiScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
  },
  aiScoreText: {
    ...theme.typography.caption,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyCard: {
    ...theme.shadows.small,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  setupButton: {
    marginTop: theme.spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  actionTitle: {
    ...theme.typography.subtitle2,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  actionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});