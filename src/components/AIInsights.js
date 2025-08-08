import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  Modal,
  Portal,
  IconButton,
  ActivityIndicator,
  ProgressBar,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { analyticsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../styles/theme";

const { width: screenWidth } = Dimensions.get("window");

export default function AIInsights({
  targetId,
  targetType,
  analysisType,
  buttonStyle,
  buttonText = '🤖 AI Insights',
  visible,
  onDismiss,
  trigger = "button", // 'button' or 'modal'
}) {
  const [modalVisible, setModalVisible] = useState(visible || false);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleGetInsights = async () => {
    if (!token || !targetId || !targetType || !analysisType) {
      setError("Missing required information for AI analysis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await analyticsAPI.getAIInsights(
        targetId,
        targetType,
        analysisType,
        token
      );
      setInsights(response.insights);
      if (trigger === "button") {
        setModalVisible(true);
      }
    } catch (err) {
      console.error("AI Insights error:", err);
      setError(err.response?.data?.message || "Failed to generate AI insights");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Auto-load insights when modal is opened externally
  React.useEffect(() => {
    if (visible && !insights && !loading) {
      handleGetInsights();
    }
  }, [visible]);

  const renderInsightsSummary = () => {
    if (!insights || !insights.summary) {return null;}

    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryHeader}>
            <Icon name="auto-awesome" size={24} color={theme.colors.primary} />
            <Text style={styles.summaryTitle}>AI Analysis Summary</Text>
          </View>

          <Text style={styles.summaryOverview}>
            {insights.summary.overview}

          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Key Findings:</Text>
            {insights.summary.keyFindings.map((finding, index) => (
              <View key={index} style={styles.findingItem}>
                <Icon
                  name="check-circle"
                  size={16}
                  color={theme.colors.success}
                />
                <Text style={styles.findingText}>{finding}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Recommendations:</Text>
            {insights.summary.recommendations.map((rec, index) => (
              <View key={index} style={styles.findingItem}>
                <Icon name="lightbulb" size={16} color={theme.colors.warning} />
                <Text style={styles.findingText}>{rec}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderInvestorRecommendations = () => {
    if (insights?.type !== "investor_analysis" || !insights.recommendations)
      {return null;}

    return (
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>🎯 Recommended Investors</Text>

        {insights.recommendations.map((rec, index) => (
          <Card key={rec.investor.id} style={styles.investorCard}>
            <Card.Content>
              <View style={styles.investorHeader}>
                <Image
                  source={{
                    uri:
                      rec.investor.profilePicture ||
                      "https://via.placeholder.com/50",
                  }}
                  style={styles.investorAvatar}
                />
                <View style={styles.investorInfo}>
                  <Text style={styles.investorName}>{rec.investor.name}</Text>
                  <Text style={styles.investorStats}>
                    {rec.investor.totalInvestments} investments •
                    {Math.round(
                      rec.investor.averageInvestment
                    ).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.compatibilityScore}>
                  <Text style={styles.scoreText}>
                    {rec.compatibilityScore}%
                  </Text>
                  <Text style={styles.scoreLabel}>Match</Text>
                </View>
              </View>

              <View style={styles.investorSectors}>
                {rec.investor.preferredSectors
                  .slice(0, 3)
                  .map((sector, idx) => (
                    <Chip key={idx} mode="outlined" style={styles.sectorChip}>
                      {sector}
                    </Chip>
                  ))}
              </View>

              <View style={styles.reasoningSection}>
                <Text style={styles.reasoningTitle}>Why this investor:</Text>
                {rec.reasoning.map((reason, idx) => (
                  <Text key={idx} style={styles.reasoningText}>
                    • {reason}
                  </Text>
                ))}
              </View>

              <ProgressBar
                progress={rec.compatibilityScore / 100}
                color={
                  rec.compatibilityScore > 75
                    ? theme.colors.success
                    : rec.compatibilityScore > 50
                    ? theme.colors.warning
                    : theme.colors.error
                }
                style={styles.compatibilityBar}
              />
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderStartupRecommendations = () => {
    if (insights?.type !== "startup_analysis" || !insights.recommendations)
      {return null;}

    return (
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>💡 Recommended Startups</Text>

        {insights.recommendations.map((rec, index) => (
          <Card key={rec.startup.id} style={styles.startupCard}>
            <Card.Content>
              <View style={styles.startupHeader}>
                <Image
                  source={{
                    uri: rec.startup.logo || "https://via.placeholder.com/60",
                  }}
                  style={styles.startupLogo}
                />
                <View style={styles.startupInfo}>
                  <Text style={styles.startupName}>{rec.startup.name}</Text>
                  <Text style={styles.startupTagline}>
                    {rec.startup.tagline}
                  </Text>
                  <View style={styles.startupMeta}>
                    <Chip mode="outlined" style={styles.sectorChip}>
                      {rec.startup.sector}
                    </Chip>
                    <Chip mode="outlined" style={styles.stageChip}>
                      {rec.startup.stage}
                    </Chip>
                  </View>
                </View>
                <View style={styles.compatibilityScore}>
                  <Text style={styles.scoreText}>
                    {rec.compatibilityScore}%
                  </Text>
                  <Text style={styles.scoreLabel}>Match</Text>
                </View>
              </View>

              <View style={styles.fundingProgress}>
                <Text style={styles.fundingText}>
                  ${rec.startup.fundingProgress.current.toLocaleString()} of $
                  {rec.startup.fundingProgress.target.toLocaleString()}
                </Text>
                <ProgressBar
                  progress={rec.startup.fundingProgress.percentage / 100}
                  color={theme.colors.primary}
                  style={styles.fundingBar}
                />
                <Text style={styles.fundingPercentage}>
                  {rec.startup.fundingProgress.percentage.toFixed(0)}% funded
                </Text>
              </View>

              <View style={styles.analysisSection}>
                <View style={styles.riskAssessment}>
                  <Text style={styles.riskTitle}>
                    Risk Level:
                    <Text
                      style={[
                        styles.riskLevel,
                        {
                          color:
                            rec.riskAssessment.level === "Low"
                              ? theme.colors.success
                              : rec.riskAssessment.level === "Medium"
                              ? theme.colors.warning
                              : theme.colors.error,
                        },
                      ]}
                    >
                      {" "}
                      {rec.riskAssessment.level}
                    </Text>
                  </Text>
                  {rec.riskAssessment.factors.map((factor, idx) => (
                    <Text key={idx} style={styles.riskFactor}>
                      • {factor}
                    </Text>
                  ))}
                </View>

                <View style={styles.potentialReturns}>
                  <Text style={styles.returnsTitle}>Potential Returns:</Text>
                  <Text style={styles.returnsMultiplier}>
                    {rec.potentialReturns.estimatedMultiplier}
                  </Text>
                  <Text style={styles.returnsTimeframe}>
                    {rec.potentialReturns.timeframe}
                  </Text>
                </View>
              </View>

              <View style={styles.reasoningSection}>
                <Text style={styles.reasoningTitle}>Why this startup:</Text>
                {rec.reasoning.map((reason, idx) => (
                  <Text key={idx} style={styles.reasoningText}>
                    • {reason}
                  </Text>
                ))}
              </View>

              <ProgressBar
                progress={rec.compatibilityScore / 100}
                color={
                  rec.compatibilityScore > 75
                    ? theme.colors.success
                    : rec.compatibilityScore > 50
                    ? theme.colors.warning
                    : theme.colors.error
                }
                style={styles.compatibilityBar}
              />
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing with AI...</Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            mode="outlined"
            onPress={handleGetInsights}
            style={styles.retryButton}
          >
            Try Again
          </Button>
        </View>
      );
    }

    if (!insights) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="psychology" size={64} color={theme.colors.primary} />
          <Text style={styles.emptyTitle}>AI-Powered Insights</Text>
          <Text style={styles.emptyText}>
            Get personalized recommendations and analysis powered by artificial
            intelligence
          </Text>
          <Button
            mode="contained"
            onPress={handleGetInsights}
            style={styles.generateButton}
          >
            Generate Insights
          </Button>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
      >
        {renderInsightsSummary()}
        {renderInvestorRecommendations()}
        {renderStartupRecommendations()}

        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>
            Analysis generated on{" "}
            {new Date(insights.analysisTimestamp).toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    );
  };

  if (trigger === "button") {
    return (
      <>
        <Button
          mode="outlined"
          onPress={handleGetInsights}
          loading={loading}
          style={[styles.insightsButton, buttonStyle]}
          icon="psychology"
        >
          {buttonText}
        </Button>

        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={handleClose}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Insights</Text>
              <IconButton icon="close" onPress={handleClose} />
            </View>
            {renderContent()}
          </Modal>
        </Portal>
      </>
    );
  }

  // Modal trigger mode
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>AI Insights</Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>
        {renderContent()}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  insightsButton: {
    marginTop: 8,
    borderColor: theme.colors.primary,
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
    maxHeight: "90%",
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.onSurface,
  },
  contentScroll: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    color: theme.colors.onSurface,
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: "center",
    marginVertical: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    color: theme.colors.onSurface,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    marginVertical: 16,
    lineHeight: 24,
  },
  generateButton: {
    marginTop: 24,
    paddingHorizontal: 32,
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.primaryContainer,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: theme.colors.onPrimaryContainer,
  },
  summaryOverview: {
    fontSize: 16,
    marginBottom: 16,
    color: theme.colors.onPrimaryContainer,
    lineHeight: 24,
  },
  summarySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  findingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  findingText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: 16,
  },
  investorCard: {
    marginBottom: 16,
    elevation: 2,
  },
  investorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  investorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  investorInfo: {
    flex: 1,
  },
  investorName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
  investorStats: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  investorSectors: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  sectorChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  compatibilityScore: {
    alignItems: "center",
    backgroundColor: theme.colors.secondaryContainer,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.onSecondaryContainer,
  },
  scoreLabel: {
    fontSize: 12,
    color: theme.colors.onSecondaryContainer,
  },
  reasoningSection: {
    marginBottom: 12,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: theme.colors.onSurface,
  },
  reasoningText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  compatibilityBar: {
    height: 6,
    borderRadius: 3,
  },
  startupCard: {
    marginBottom: 16,
    elevation: 2,
  },
  startupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  startupLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  startupInfo: {
    flex: 1,
  },
  startupName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
  startupTagline: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: 8,
  },
  startupMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  stageChip: {
    marginLeft: 8,
  },
  fundingProgress: {
    marginBottom: 16,
  },
  fundingText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: theme.colors.onSurface,
  },
  fundingBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  fundingPercentage: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  analysisSection: {
    flexDirection: "row",
    marginBottom: 12,
  },
  riskAssessment: {
    flex: 1,
    marginRight: 16,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  riskLevel: {
    fontWeight: "bold",
  },
  riskFactor: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  potentialReturns: {
    alignItems: "center",
    backgroundColor: theme.colors.tertiaryContainer,
    padding: 12,
    borderRadius: 8,
  },
  returnsTitle: {
    fontSize: 12,
    color: theme.colors.onTertiaryContainer,
    marginBottom: 4,
  },
  returnsMultiplier: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.onTertiaryContainer,
  },
  returnsTimeframe: {
    fontSize: 10,
    color: theme.colors.onTertiaryContainer,
  },
  timestampContainer: {
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: 16,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: "italic",
  },
});
