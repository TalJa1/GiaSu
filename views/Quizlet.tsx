import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  PanResponder,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../constants/Colors';
import { getQuizletsByLesson } from '../apis/quizletApi';
import { Quizlet } from '../apis/models';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const QuizletScreen: React.FC<any> = ({ route }) => {
  const lessonId: number = route?.params?.lessonId ?? 0;
  const [items, setItems] = useState<Quizlet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Animation values
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const currentCard = items[currentIndex];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getQuizletsByLesson(lessonId);
        if (!mounted) return;
        setItems(data ?? []);

        // Initial entrance animation
        if (data && data.length > 0) {
          cardOpacity.setValue(0);
          cardScale.setValue(0.8);
          Animated.parallel([
            Animated.timing(cardOpacity, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
            Animated.timing(cardScale, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
          ]).start();
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? 'Failed to load quizlets');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [lessonId, cardOpacity, cardScale]);

  const goToNext = () => {
    if (currentIndex < items.length - 1) {
      animateCardTransition('next');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      animateCardTransition('previous');
    }
  };

  const toggleAnswer = () => {
    animateFlip();
  };

  const animateCardTransition = (direction: 'next' | 'previous') => {
    const targetX = direction === 'next' ? -300 : 300;

    // Slide out current card
    Animated.parallel([
      Animated.timing(cardTranslateX, {
        toValue: targetX,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update the index
      if (direction === 'next') {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(prev => prev - 1);
      }
      setShowAnswer(false);

      // Reset card position for slide in
      cardTranslateX.setValue(direction === 'next' ? 300 : -300);

      // Slide in new card
      Animated.parallel([
        Animated.timing(cardTranslateX, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const animateFlip = () => {
    Animated.sequence([
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(flipAnimation, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle answer state in the middle of animation
    setTimeout(() => {
      setShowAnswer(prev => !prev);
    }, 200);
  };

  // Create pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Update card position during drag
      cardTranslateX.setValue(gestureState.dx * 0.5);

      // Scale card slightly during drag
      const scale = 1 - Math.abs(gestureState.dx) * 0.0005;
      cardScale.setValue(Math.max(0.95, scale));
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx, dy } = gestureState;

      // Reset scale
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // Horizontal swipes
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx > 0) {
          // Swipe right - go to previous
          goToPrevious();
        } else {
          // Swipe left - go to next
          goToNext();
        }
      }
      // Vertical swipes (down to show answer)
      else if (Math.abs(dy) > Math.abs(dx) && dy > 50) {
        // Reset position and animate flip
        Animated.spring(cardTranslateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        toggleAnswer();
      }
      // No swipe - reset position
      else {
        Animated.spring(cardTranslateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => (navigation as any).goBack()}
          style={styles.headerBack}
        >
          <Icon name="chevron-left" size={24} color={Colors.text.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quizlet</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.empty}>No items</Text>
        ) : (
          <>
            <View style={styles.cardContainer} {...panResponder.panHandlers}>
              <Animated.View
                style={[
                  styles.card,
                  {
                    transform: [
                      { translateX: cardTranslateX },
                      { scale: cardScale },
                      {
                        rotateY: flipAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg'],
                        }),
                      },
                    ],
                    opacity: cardOpacity,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.cardTouchable}
                  onPress={toggleAnswer}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardType}>
                      {showAnswer ? 'Answer' : 'Question'}
                    </Text>
                    <Icon
                      name={showAnswer ? 'lightbulb' : 'help-circle'}
                      size={20}
                      color={Colors.primary.main}
                    />
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.cardText}>
                      {showAnswer
                        ? currentCard?.answer || 'No answer provided'
                        : currentCard?.question ||
                          `Question ${currentIndex + 1}`}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.tapHint}>
                      {showAnswer
                        ? 'Tap to show question'
                        : 'Tap to show answer'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Swipe gesture hint */}
              <View style={styles.gestureHints}>
                <View style={styles.gestureHint}>
                  <Icon
                    name="chevron-left"
                    size={16}
                    color={Colors.text.secondary}
                  />
                  <Text style={styles.gestureText}>
                    Swipe left for previous
                  </Text>
                </View>
                <View style={styles.gestureHint}>
                  <Text style={styles.gestureText}>Swipe right for next</Text>
                  <Icon
                    name="chevron-right"
                    size={16}
                    color={Colors.text.secondary}
                  />
                </View>
              </View>
            </View>

            <View style={styles.controls}>
              <Animated.View style={{ transform: [{ scale: cardScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentIndex === 0 && styles.navButtonDisabled,
                  ]}
                  onPress={goToPrevious}
                  disabled={currentIndex === 0}
                >
                  <Icon
                    name="chevron-left"
                    size={18}
                    color={Colors.text.white}
                  />
                  <Text
                    style={[
                      styles.navButtonText,
                      currentIndex === 0 && styles.navButtonTextDisabled,
                    ]}
                  >
                    Previous
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {currentIndex + 1} of {items.length}
                </Text>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((currentIndex + 1) / items.length) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: cardScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentIndex === items.length - 1 &&
                      styles.navButtonDisabled,
                  ]}
                  onPress={goToNext}
                  disabled={currentIndex === items.length - 1}
                >
                  <Text
                    style={[
                      styles.navButtonText,
                      currentIndex === items.length - 1 &&
                        styles.navButtonTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={Colors.text.white}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default QuizletScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  headerBar: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerBack: {
    position: 'absolute',
    left: 16,
    top: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.white,
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    minHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardTouchable: {
    flex: 1,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cardType: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.main,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardText: {
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  gestureHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 400,
  },
  gestureHint: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
  },
  gestureText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginHorizontal: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  navButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 90,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navButtonDisabled: {
    backgroundColor: Colors.ui.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  navButtonText: {
    color: Colors.text.white,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  navButtonTextDisabled: {
    color: Colors.text.secondary,
  },
  progressContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 20,
  },
  progressText: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 3,
  },
  empty: {
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  error: {
    color: Colors.status.error,
    textAlign: 'center',
    fontSize: 16,
  },
});
