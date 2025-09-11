/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  StatusBar,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import Colors from './constants/Colors';

// Import your views
import Login from './views/Login';
import Home from './views/bottomtabs/Home';
import Study from './views/bottomtabs/Study';
import School from './views/bottomtabs/School';
import Exam from './views/bottomtabs/Exam';
import GiaSuAI from './views/bottomtabs/GiaSuAI';
import Infor from './views/welcomeViews/Infor';
import UniversitiesList from './views/UniversitiesList';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Bar Icon Component
const TabBarIcon = ({
  routeName,
  color,
  size,
}: {
  routeName: string;
  color: string;
  size: number;
}) => {
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
    case 'Chat':
      iconName = 'comments';
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
      case 'Chat':
        return 'Chat';
      default:
        return routeName;
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: Colors.dark.surface,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
        shadowColor: Colors.ui.shadow,
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: Colors.opacity.low,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
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
              backgroundColor: isFocused ? Colors.primary.main : 'transparent',
              paddingHorizontal: isFocused ? 20 : 12,
              paddingVertical: 10,
              borderRadius: 25,
              flexDirection: 'row',
              alignItems: 'center',
              minWidth: isFocused ? 'auto' : 44,
              justifyContent: 'center',
              shadowColor: isFocused ? Colors.primary.main : 'transparent',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: isFocused ? Colors.opacity.medium : 0,
              shadowRadius: 6,
              elevation: isFocused ? 4 : 0,
            }}
          >
            <TabBarIcon
              routeName={route.name}
              color={isFocused ? Colors.text.white : Colors.text.secondary}
              size={22}
            />
            {isFocused && (
              <Text
                style={{
                  color: Colors.text.white,
                  marginLeft: 10,
                  fontSize: 15,
                  fontWeight: '600',
                }}
              >
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
      <Tab.Screen name="Chat" component={GiaSuAI} />
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
            headerShown: false, // Hide headers for all stack screens by default
          }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
          <Stack.Screen
            name="Quizlet"
            component={require('./views/Quizlet').default}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="LessonDetail"
            component={require('./views/LessonDetail').default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TestRunner"
            component={require('./views/TestRunner').default}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Universities" component={UniversitiesList} />
          <Stack.Screen name="Infor" component={Infor} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
