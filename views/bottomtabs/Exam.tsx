import { StyleSheet, Text, ScrollView, View, StatusBar } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

const Exam = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.main} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exam</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Exam content goes here */}
        {/* Add your exam content here - tests, quizzes, practice exams, etc. */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Exam;

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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  header: {
  height: 56,
  backgroundColor: Colors.primary.main,
  justifyContent: 'center',
  alignItems: 'center',
  borderBottomWidth: 1,
  borderBottomColor: Colors.ui.border,
  },
  headerTitle: {
    color: Colors.text.white,
  fontSize: 18,
  fontWeight: '700',
  },
});
