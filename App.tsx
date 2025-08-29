import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
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

// Bottom Tab Navigator Component
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <TabBarIcon routeName={route.name} color={color} size={size} />
        ),
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false, // Hide headers for tab screens since we use SafeAreaView
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{ tabBarLabel: 'Trang Chủ' }}
      />
      <Tab.Screen 
        name="Study" 
        component={Study} 
        options={{ tabBarLabel: 'Học Tập' }}
      />
      <Tab.Screen 
        name="School" 
        component={School} 
        options={{ tabBarLabel: 'Trường ĐH' }}
      />
      <Tab.Screen 
        name="Exam" 
        component={Exam} 
        options={{ tabBarLabel: 'Kiểm Tra' }}
      />
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
