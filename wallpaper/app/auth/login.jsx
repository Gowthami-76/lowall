import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert ,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import { BASE_URL } from '../../utils/constants';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const shakeValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeValue.value },
      { scale: scaleValue.value },
    ],
  }));

  const handleLogin = async() => {
     if (!email.trim()) {
    alert('Please enter your email');
    return;
  }
  if (!password.trim()) {
    alert('Please enter your password');
    return;
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    alert('Please enter a valid email address');
    return;
  }
  if (password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

    setIsLoading(true);
    try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password: password.trim(),
        deviceInfo: {
          deviceToken: 'test_token_123', // hardcoded
          deviceType: 'android',         // hardcoded
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    console.log('Login success:', data);
    if (data.token) {
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem("userId", data.user._id); // 👈 Save userId here
await AsyncStorage.setItem("userName", data.user.firstName +" "+data.user.lastName|| "");
  }
     Alert.alert(
      'Success',
      'Login successful',
      [
        {
          text: 'OK',
          onPress: () => {
            // router.replace('/(tabs)');
            router.replace('/(tabs)/profile');

          },
        },
      ]
    );
  } catch (error) {
    console.error('Login error:', error.message);
    alert(error.message);
  } finally {
    setIsLoading(false);
  }
  };

  const handleGoogleLogin = () => {
    // Add Google login logic here
    console.log('Google login pressed');
  };

  const handleFacebookLogin = () => {
    // Add Facebook login logic here
    console.log('Facebook login pressed');
  };

  const handleSignUp = () => {
    router.push('/auth/register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>

        {/* Logo at Top */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo2.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome Back <Text style={styles.brand}>LOWALL</Text>
          </Text>
          <Text style={styles.subtitle}>Sign in to continue sharing wallpapers</Text>
        </View>

        {/* Form */}
        <Animated.View style={[styles.form, shakeStyle]}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#9CA3AF" />
            <TextInput
              style={styles.textInput}
              placeholder="Email or phone"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#9CA3AF" />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={20} color="#9CA3AF" />
              ) : (
                <Eye size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Social Login */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/1161472/pexels-photo-1161472.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop' }}
                style={styles.socialIcon}
              />
              <Image
                source={{ uri: 'https://images.pexels.com/photos/1161472/pexels-photo-1161472.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop' }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>

              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        {/* Sign Up Link */}
       
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  socialIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  socialIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  signUpText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  signUpText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  brand: {
    color: '#8B5CF6',
    fontWeight: 'bold',
    fontFamily: 'BrunoAceSC',
  },
});