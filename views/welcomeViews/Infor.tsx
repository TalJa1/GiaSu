import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { createUserPref } from '../../apis/userPreferencesApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const steps = [
  {
    key: 'preferred_major',
    title: 'Preferred Major',
    placeholder: 'e.g. Mathematics',
  },
  {
    key: 'current_score',
    title: 'Current Score',
    placeholder: 'Enter current score (number)',
  },
  {
    key: 'expected_score',
    title: 'Expected Score',
    placeholder: 'Enter expected score (number)',
  },
];

const Infor: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [preferredMajor, setPreferredMajor] = useState('');
  const [currentScore, setCurrentScore] = useState('');
  const [expectedScore, setExpectedScore] = useState('');
  const [loading, setLoading] = useState(false);

  const validateStep = (index: number) => {
    if (index === 0) return preferredMajor.trim().length > 0;
    if (index === 1)
      return !isNaN(Number(currentScore)) && currentScore.trim() !== '';
    if (index === 2)
      return !isNaN(Number(expectedScore)) && expectedScore.trim() !== '';
    return false;
  };

  const goNext = () => {
    if (!validateStep(stepIndex)) {
      Alert.alert('Validation', 'Please enter a valid value to continue.');
      return;
    }
    if (stepIndex < steps.length - 1) {
      setStepIndex(s => s + 1);
      return;
    }
    // last step -> submit
    submitPrefs();
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex(s => s - 1);
  };

  const submitPrefs = async () => {
    // final validation
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      Alert.alert(
        'Validation',
        'Please fill all fields correctly before submitting.',
      );
      return;
    }

    const payload = {
      user_id: 0, // not required from user as per requirements
      preferred_major: preferredMajor.trim(),
      current_score: Number(currentScore),
      expected_score: Number(expectedScore),
    };

    try {
      setLoading(true);
      await createUserPref(payload as any);
      setLoading(false);
      Alert.alert('Success', 'Your preferences were saved.');
      // reset/optional: clear fields or navigate away
      setPreferredMajor('');
      setCurrentScore('');
      setExpectedScore('');
      setStepIndex(0);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err?.message ?? 'Failed to save preferences');
    }
  };

  const currentStep = steps[stepIndex];

  const renderInput = () => {
    if (currentStep.key === 'preferred_major') {
      return (
        <TextInput
          style={styles.input}
          placeholder={currentStep.placeholder}
          value={preferredMajor}
          onChangeText={setPreferredMajor}
          autoCapitalize="words"
          returnKeyType="done"
        />
      );
    }

    // numeric inputs
    const isNumeric = currentStep.key !== 'preferred_major';
    const value =
      currentStep.key === 'current_score' ? currentScore : expectedScore;
    const onChange =
      currentStep.key === 'current_score' ? setCurrentScore : setExpectedScore;

    return (
      <TextInput
        style={styles.input}
        placeholder={currentStep.placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={isNumeric ? 'numeric' : 'default'}
        returnKeyType="done"
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Icon name="school" size={22} color={Colors.text.white} />
            </View>
            <Text style={styles.title}>{currentStep.title}</Text>
          </View>

          {renderInput()}

          <View style={styles.stepDots}>
            {steps.map((s, i) => (
              <View
                key={s.key}
                style={[
                  styles.dot,
                  { backgroundColor: i === stepIndex ? Colors.primary.main : Colors.ui.divider },
                ]}
              />
            ))}
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={goBack}
              style={[styles.ghostButton, stepIndex === 0 && styles.buttonDisabled]}
              disabled={stepIndex === 0}
            >
              <Icon name="arrow-back-ios" size={16} color={Colors.primary.main} />
              <Text style={[styles.ghostText]}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={goNext} style={styles.primaryButton}>
              {loading && stepIndex === steps.length - 1 ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.primaryContent}>
                  <Text style={styles.primaryText}>{stepIndex === steps.length - 1 ? 'Submit' : 'Next'}</Text>
                  <Icon name={stepIndex === steps.length - 1 ? 'check' : 'arrow-forward-ios'} size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Infor;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.ui.divider,
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 18,
    backgroundColor: Colors.background.secondary,
  },
  stepDots: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 4 },
  navRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  ghostButton: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  ghostText: { color: Colors.primary.main, marginLeft: 6 },
  primaryButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryContent: { flexDirection: 'row', alignItems: 'center' },
  primaryText: { color: Colors.text.white, fontWeight: '600', marginRight: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: Colors.text.white, fontWeight: '600' },
  stepCounter: { marginTop: 12, color: Colors.text.secondary },
});
