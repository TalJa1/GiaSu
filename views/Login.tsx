import {
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  View,
  TextInput,
  Image,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Colors from '../constants/Colors';

const Login = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    navigation.replace('MainApp');
  };

  const handleGoogleLogin = () => {
    console.log('Google login pressed');
    navigation.replace('MainApp');
  };

  const handleFacebookLogin = () => {
    console.log('Facebook login pressed');
    navigation.replace('MainApp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/GiaSu_Logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.subtitle}>
            Smart learning, bright future
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome back!</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="email"
              size={20}
              color={Colors.text.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              placeholderTextColor={Colors.text.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="lock"
              size={20}
              color={Colors.text.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor={Colors.text.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Icon name="google" size={20} color={Colors.text.white} />
            <Text style={styles.socialButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.facebookButton}
            onPress={handleFacebookLogin}
          >
            <Icon name="facebook" size={20} color={Colors.text.white} />
            <Text style={styles.socialButtonText}>Sign in with Facebook</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.signupLink}>Sign up now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.ui.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: Colors.opacity.low,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary.main,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: Colors.ui.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: Colors.opacity.low,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary.main,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary.main,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: Colors.opacity.medium,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.ui.divider,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  googleButton: {
    backgroundColor: Colors.status.error,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.status.error,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: Colors.opacity.low,
    shadowRadius: 6,
    elevation: 4,
  },
  facebookButton: {
    backgroundColor: Colors.secondary.indigo,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.secondary.indigo,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: Colors.opacity.low,
    shadowRadius: 6,
    elevation: 4,
  },
  socialButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  signupText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  signupLink: {
    fontSize: 14,
    color: Colors.primary.main,
    fontWeight: '600',
  },
});
