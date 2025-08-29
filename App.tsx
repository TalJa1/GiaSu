/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { StatusBar, useColorScheme, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';

// Import your views
import Login from './views/Login';
import Home from './views/bottomtabs/Home';
import Study from './views/bottomtabs/Study';
import School from './views/bottomtabs/School';
import Exam from './views/bottomtabs/Exam';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Bar Icon Component
const TabBarIcon = ({ routeName, color, size }: { routeName: string; color: string; size: number }) => {
  let iconName: string;

  switch (routeName) {
    case 'Home':
      iconName = 'home';
      break;
    case 'Study':
      iconName = 'book';
      break;
    case 'School':
      iconName = 'university';
      break;
    case 'Exam':
      iconName = 'edit';
      break;
    default:
      iconName = 'home';
  }

  return <Icon name={iconName} size={size} color={color} />;
};

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'Home';
      case 'Study':
        return 'Study';
      case 'School':
        return 'School';
      case 'Exam':
        return 'Exam';
      default:
        return routeName;
    }
  };

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#1a1a1a',
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'space-around',
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={{
              backgroundColor: isFocused ? '#2196F3' : 'transparent',
              paddingHorizontal: isFocused ? 16 : 8,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              minWidth: isFocused ? 'auto' : 40,
              justifyContent: 'center',
            }}
          >
            <TabBarIcon 
              routeName={route.name} 
              color={isFocused ? '#fff' : '#8E8E93'} 
              size={20} 
            />
            {isFocused && (
              <Text style={{
                color: '#fff',
                marginLeft: 8,
                fontSize: 14,
                fontWeight: '600',
              }}>
                {getTabLabel(route.name)}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Bottom Tab Navigator Component
function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Study" component={Study} />
      <Tab.Screen name="School" component={School} />
      <Tab.Screen name="Exam" component={Exam} />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false, // Hide headers for all stack screens
          }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
