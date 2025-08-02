import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Image,
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
import { investmentsAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles, theme } from '../styles/theme';
import AIInsights from '../components/AIInsights';

export default function InvestorDashboard({ navigation }) {
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioStats, setPortfolioStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const [portfolioResponse, statsResponse] = await Promise.all([
        investmentsAPI.getPortfolio(token),
        analyticsAPI.getPortfolioPerformance(token)
      ]);
      
      setPortfolio(portfolioResponse.data || []);
      setPortfolioStats(statsResponse.data || {});
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPortfolioData();
    setRefreshing(false);
  };

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
        <Text style={styles.loadingText}>Loading your portfolio...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Investment Portfolio</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.firstName}!</Text>
      </View>

      {/* Portfolio Stats */}
      {portfolioStats && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Portfolio Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency(portfolioStats.totalInvested || 0)}
                </Text>
                <Text style={styles.statLabel}>Total Invested</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {portfolioStats.totalStartups || portfolio.length}
                </Text>
                <Text style={styles.statLabel}>Startups</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  { color: (portfolioStats.totalReturns || 0) >= 0 ? theme.colors.success : theme.colors.error }
                ]}>
                  {formatCurrency(portfolioStats.totalReturns || 0)}
                </Text>
                <Text style={styles.statLabel}>Returns</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* AI Insights Section */}
      <Card style={styles.aiInsightsCard}>
        <Card.Content>
          <View style={styles.aiInsightsHeader}>
            <Icon name="psychology" size={28} color={theme.colors.primary} />
            <View style={styles.aiInsightsHeaderText}>
              <Text style={styles.sectionTitle}>AI Investment Recommendations</Text>
              <Text style={styles.aiInsightsDescription}>
                Discover personalized startup opportunities based on your investment history and preferences
              </Text>
            </View>
          </View>
          
          <AIInsights
            targetId={user?._id}
            targetType="investor"
            analysisType="startup_analysis"
            buttonText="🚀 Find Investment Opportunities"
            buttonStyle={styles.aiInsightsButton}
          />
        </Card.Content>
      </Card>

      {/* Current Investments */}
      <View style={styles.investmentsSection}>
        <Text style={styles.sectionTitle}>Your Investments</Text>
        
        {portfolio.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyState}>
                <Icon name="trending-up" size={64} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.emptyTitle}>Start Your Investment Journey</Text>
                <Text style={styles.emptyText}>
                  You haven't made any investments yet. Explore startups and begin building your portfolio.
                </Text>
                <Button
                  mode="contained"
                  style={styles.exploreButton}
                  onPress={() => navigation.navigate('Explore')}
                >
                  Explore Startups
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : (
          portfolio.map((investment) => (
            <Card key={investment._id} style={styles.investmentCard}>
              <Card.Content>
                <View style={styles.investmentHeader}>
                  <Image
                    source={{ uri: investment.startup?.logo || 'https://via.placeholder.com/50' }}
                    style={styles.startupLogo}
                  />
                  <View style={styles.investmentInfo}>
                    <Text style={styles.startupName}>{investment.startup?.name}</Text>
                    <Text style={styles.startupSector}>{investment.startup?.sector}</Text>
                  </View>
                  <View style={styles.investmentAmount}>
                    <Text style={styles.amountText}>
                      {formatCurrency(investment.amount)}
                    </Text>
                    <Text style={styles.investmentDate}>
                      {new Date(investment.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {investment.startup && (
                  <View style={styles.startupProgress}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Funding Progress</Text>
                      <Text style={styles.progressText}>
                        {Math.round(
                          ((investment.startup.funding?.currentAmount || 0) / 
                           (investment.startup.funding?.targetAmount || 1)) * 100
                        )}% funded
                      </Text>
                    </View>
                    <ProgressBar
                      progress={
                        (investment.startup.funding?.currentAmount || 0) / 
                        (investment.startup.funding?.targetAmount || 1)
                      }
                      color={getSectorColor(investment.startup.sector)}
                      style={styles.progressBar}
                    />
                  </View>
                )}

                <View style={styles.investmentActions}>
                  <Button
                    mode="outlined"
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('StartupDetail', { 
                      startupId: investment.startup?._id 
                    })}
                  >
                    View Details
                  </Button>
                  <Chip
                    mode="flat"
                    style={[
                      styles.statusChip,
                      { backgroundColor: getSectorColor(investment.startup?.sector) + '20' }
                    ]}
                    textStyle={{ color: getSectorColor(investment.startup?.sector) }}
                  >
                    {investment.status || 'Active'}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </View>

      {/* Sector Distribution */}
      {portfolio.length > 0 && (
        <Card style={styles.distributionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Sector Distribution</Text>
            <View style={styles.sectorChips}>
              {[...new Set(portfolio.map(inv => inv.startup?.sector))].map((sector, index) => (
                <Chip
                  key={index}
                  mode="flat"
                  style={[
                    styles.sectorChip,
                    { backgroundColor: getSectorColor(sector) + '20' }
                  ]}
                  textStyle={{ color: getSectorColor(sector) }}
                >
                  {sector}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsCard: {
    margin: 16,
    marginTop: -30,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  aiInsightsCard: {
    margin: 16,
    elevation: 3,
    backgroundColor: theme.colors.tertiaryContainer,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  aiInsightsHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  aiInsightsDescription: {
    fontSize: 14,
    color: theme.colors.onTertiaryContainer,
    lineHeight: 20,
  },
  aiInsightsButton: {
    borderColor: theme.colors.primary,
    backgroundColor: 'white',
  },
  investmentsSection: {
    padding: 16,
  },
  emptyCard: {
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 32,
  },
  investmentCard: {
    marginBottom: 12,
    elevation: 2,
  },
  investmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  startupLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  investmentInfo: {
    flex: 1,
  },
  startupName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  startupSector: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  investmentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  investmentDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  startupProgress: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  investmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    marginRight: 12,
  },
  statusChip: {
    paddingHorizontal: 8,
  },
  distributionCard: {
    margin: 16,
    elevation: 2,
  },
  sectorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectorChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});