import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import CreateStartupScreen from './src/screens/CreateStartupScreen';
import InvestorDashboard from './src/screens/InvestorDashboard';
import ProfileScreen from './src/screens/ProfileScreen';
import StartupDetailScreen from './src/screens/StartupDetailScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import AIRecommendationsScreen from './src/screens/AIRecommendationsScreen';

// Import contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { theme } from './src/styles/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main App Navigation
function MainApp() {
  const { user } = useAuth();

  const HomeStack = () => (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StartupDetail" 
        component={StartupDetailScreen}
        options={{ title: 'Startup Details' }}
      />
      <Stack.Screen 
        name="AIRecommendations" 
        component={AIRecommendationsScreen}
        options={{ title: 'AI Recommendations' }}
      />
    </Stack.Navigator>
  );

  const ExploreStack = () => (
    <Stack.Navigator>
      <Stack.Screen 
        name="ExploreMain" 
        component={ExploreScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StartupDetail" 
        component={StartupDetailScreen}
        options={{ title: 'Startup Details' }}
      />
    </Stack.Navigator>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Explore':
              iconName = 'explore';
              break;
            case 'Create':
              iconName = 'add-circle-outline';
              break;
            case 'Invest':
              iconName = 'trending-up';
              break;
            case 'Community':
              iconName = 'group';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreStack}
        options={{ headerShown: false }}
      />
      
      {/* Show Create tab only for entrepreneurs */}
      {(user?.userType === 'entrepreneur' || user?.userType === 'both') && (
        <Tab.Screen 
          name="Create" 
          component={CreateStartupScreen}
          options={{ title: 'Create Startup' }}
        />
      )}
      
      {/* Show Invest tab only for investors */}
      {(user?.userType === 'investor' || user?.userType === 'both') && (
        <Tab.Screen 
          name="Invest" 
          component={InvestorDashboard}
          options={{ title: 'Portfolio' }}
        />
      )}
      
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{ title: 'Community' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Root navigation component
function AppNavigation() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainApp} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main App component
export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </PaperProvider>
  );
}