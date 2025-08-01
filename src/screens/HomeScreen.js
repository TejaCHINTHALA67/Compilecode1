import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
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
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { startupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { theme, commonStyles } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [startups, setStartups] = useState([]);
  const [featuredStartups, setFeaturedStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    loadStartups();
    loadFeaturedStartups();
  }, []);

  const loadStartups = async () => {
    try {
      const response = await startupsAPI.getTrending(20);
      setStartups(response.data || []);
    } catch (error) {
      console.error('Error loading startups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedStartups = async () => {
    try {
      const response = await startupsAPI.getFeatured(5);
      setFeaturedStartups(response.data || []);
    } catch (error) {
      console.error('Error loading featured startups:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStartups(), loadFeaturedStartups()]);
    setRefreshing(false);
  };

  const handleLike = async (startupId) => {
    if (!token) return;
    
    try {
      await startupsAPI.like(startupId, token);
      // Update local state
      setStartups(prev => prev.map(startup => 
        startup._id === startupId 
          ? { 
              ...startup, 
              isLiked: !startup.isLiked,
              engagement: {
                ...startup.engagement,
                likes: startup.isLiked 
                  ? startup.engagement.likes - 1 
                  : startup.engagement.likes + 1
              }
            }
          : startup
      ));
    } catch (error) {
      console.error('Error liking startup:', error);
    }
  };

  const handleBookmark = async (startupId) => {
    if (!token) return;
    
    try {
      await startupsAPI.bookmark(startupId, token);
      // Update local state
      setStartups(prev => prev.map(startup => 
        startup._id === startupId 
          ? { 
              ...startup, 
              isBookmarked: !startup.isBookmarked,
              engagement: {
                ...startup.engagement,
                bookmarks: startup.isBookmarked 
                  ? startup.engagement.bookmarks - 1 
                  : startup.engagement.bookmarks + 1
              }
            }
          : startup
      ));
    } catch (error) {
      console.error('Error bookmarking startup:', error);
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

  const getSectorColor = (sector) => {
    const colors = {
      'AI': '#6366F1',
      'Health': '#10B981',
      'Climate': '#059669',
      'EdTech': '#F59E0B',
      'FinTech': '#EF4444',
      'E-commerce': '#8B5CF6',
      'Gaming': '#EC4899',
      'Other': '#6B7280',
    };
    return colors[sector] || colors.Other;
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading amazing startups...</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>StartupLink</Text>
        <View style={styles.headerActions}>
          <IconButton
            icon="search"
            size={24}
            onPress={() => navigation.navigate('Explore')}
          />
          <IconButton
            icon="notifications-outline"
            size={24}
            onPress={() => {/* Navigate to notifications */}}
          />
        </View>
      </View>

      {/* Featured Startups Horizontal Scroll */}
      {featuredStartups.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>⭐ Featured Startups</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScrollContent}
          >
            {featuredStartups.map((startup) => (
              <TouchableOpacity
                key={startup._id}
                style={styles.featuredCard}
                onPress={() => navigation.navigate('StartupDetail', { startupId: startup._id })}
              >
                <Image
                  source={{ uri: startup.logo || 'https://via.placeholder.com/100' }}
                  style={styles.featuredLogo}
                />
                <Text style={styles.featuredName} numberOfLines={1}>
                  {startup.name}
                </Text>
                <Chip
                  mode="outlined"
                  style={[styles.featuredSector, { borderColor: getSectorColor(startup.sector) }]}
                  textStyle={{ color: getSectorColor(startup.sector), fontSize: 10 }}
                >
                  {startup.sector}
                </Chip>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main Feed */}
      <View style={styles.feedSection}>
        <Text style={styles.sectionTitle}>🔥 Trending Startups</Text>
        
        {startups.map((startup) => (
          <Card key={startup._id} style={styles.startupCard}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.founderInfo}>
                <Image
                  source={{ 
                    uri: startup.founder?.profilePicture || 'https://via.placeholder.com/40' 
                  }}
                  style={styles.founderAvatar}
                />
                <View style={styles.founderDetails}>
                  <Text style={styles.founderName}>
                    {startup.founder?.firstName} {startup.founder?.lastName}
                  </Text>
                  <Text style={styles.startupLocation}>
                    {startup.location?.city}, {startup.location?.country}
                  </Text>
                </View>
              </View>
              <IconButton
                icon="more-vert"
                size={20}
                onPress={() => {/* Show options menu */}}
              />
            </View>

            {/* Startup Image/Video */}
            <TouchableOpacity
              onPress={() => navigation.navigate('StartupDetail', { startupId: startup._id })}
            >
              <Image
                source={{ uri: startup.logo || 'https://via.placeholder.com/400x200' }}
                style={styles.startupImage}
                resizeMode="cover"
              />
              {startup.pitch?.video && (
                <View style={styles.videoOverlay}>
                  <Icon name="play-circle-outline" size={40} color="white" />
                </View>
              )}
            </TouchableOpacity>

            {/* Actions */}
            <View style={styles.cardActions}>
              <View style={styles.leftActions}>
                <IconButton
                  icon={startup.isLiked ? "favorite" : "favorite-border"}
                  size={24}
                  iconColor={startup.isLiked ? theme.colors.error : theme.colors.onSurface}
                  onPress={() => handleLike(startup._id)}
                />
                <IconButton
                  icon="chat-bubble-outline"
                  size={24}
                  onPress={() => navigation.navigate('StartupDetail', { startupId: startup._id })}
                />
                <IconButton
                  icon="share"
                  size={24}
                  onPress={() => {/* Share functionality */}}
                />
              </View>
              <IconButton
                icon={startup.isBookmarked ? "bookmark" : "bookmark-border"}
                size={24}
                iconColor={startup.isBookmarked ? theme.colors.primary : theme.colors.onSurface}
                onPress={() => handleBookmark(startup._id)}
              />
            </View>

            {/* Content */}
            <Card.Content style={styles.cardContent}>
              {/* Engagement Stats */}
              <Text style={styles.engagementText}>
                {startup.engagement?.likes || 0} likes • {startup.engagement?.views || 0} views
              </Text>

              {/* Startup Info */}
              <View style={styles.startupInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.startupName}>{startup.name}</Text>
                  <Chip
                    mode="flat"
                    style={[styles.sectorChip, { backgroundColor: getSectorColor(startup.sector) + '20' }]}
                    textStyle={{ color: getSectorColor(startup.sector), fontSize: 12 }}
                  >
                    {startup.sector}
                  </Chip>
                </View>
                <Text style={styles.startupTagline}>{startup.tagline}</Text>
                <Text style={styles.startupDescription} numberOfLines={3}>
                  {startup.description}
                </Text>
              </View>

              {/* Funding Info */}
              <View style={styles.fundingInfo}>
                <View style={styles.fundingHeader}>
                  <Text style={styles.fundingLabel}>Funding Progress</Text>
                  <Text style={styles.fundingAmount}>
                    {formatCurrency(startup.funding?.currentAmount || 0, startup.funding?.currency)} 
                    {' of '}
                    {formatCurrency(startup.funding?.targetAmount || 0, startup.funding?.currency)}
                  </Text>
                </View>
                <ProgressBar
                  progress={(startup.funding?.currentAmount || 0) / (startup.funding?.targetAmount || 1)}
                  color={theme.colors.success}
                  style={styles.progressBar}
                />
                <View style={styles.fundingStats}>
                  <Text style={styles.fundingStat}>
                    {startup.funding?.investorCount || 0} investors
                  </Text>
                  <Text style={styles.fundingStat}>
                    {startup.daysRemaining || 0} days left
                  </Text>
                </View>
              </View>

              {/* Invest Button */}
              {user?.userType === 'investor' || user?.userType === 'both' ? (
                <Button
                  mode="contained"
                  style={styles.investButton}
                  onPress={() => navigation.navigate('StartupDetail', { 
                    startupId: startup._id, 
                    showInvestModal: true 
                  })}
                >
                  Invest Now
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  style={styles.viewButton}
                  onPress={() => navigation.navigate('StartupDetail', { startupId: startup._id })}
                >
                  View Details
                </Button>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    ...commonStyles.spaceBetween,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    ...theme.typography.h4,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  loadingText: {
    ...theme.typography.body2,
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  featuredSection: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h6,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  featuredScrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  featuredCard: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
    width: 80,
  },
  featuredLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: theme.spacing.xs,
  },
  featuredName: {
    ...theme.typography.caption,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  featuredSector: {
    height: 20,
  },
  feedSection: {
    paddingTop: theme.spacing.md,
  },
  startupCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  cardHeader: {
    ...commonStyles.spaceBetween,
    padding: theme.spacing.md,
  },
  founderInfo: {
    ...commonStyles.row,
  },
  founderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  founderDetails: {
    flex: 1,
  },
  founderName: {
    ...theme.typography.subtitle2,
    fontWeight: '600',
  },
  startupLocation: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  startupImage: {
    width: '100%',
    height: 200,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardActions: {
    ...commonStyles.spaceBetween,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  leftActions: {
    flexDirection: 'row',
  },
  cardContent: {
    paddingTop: 0,
  },
  engagementText: {
    ...theme.typography.body2,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  startupInfo: {
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    ...commonStyles.spaceBetween,
    marginBottom: theme.spacing.xs,
  },
  startupName: {
    ...theme.typography.h6,
    fontWeight: '700',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  sectorChip: {
    height: 28,
  },
  startupTagline: {
    ...theme.typography.subtitle2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  startupDescription: {
    ...theme.typography.body2,
    lineHeight: 20,
  },
  fundingInfo: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
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
    fontWeight: '600',
    color: theme.colors.success,
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
  investButton: {
    marginTop: theme.spacing.sm,
  },
  viewButton: {
    marginTop: theme.spacing.sm,
  },
});