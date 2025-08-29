// Colors.ts - Color palette for Tutor Application

export const Colors = {
  // Primary Colors - Education & Learning Theme
  primary: {
    main: '#1ABC9C', // Main teal - trust, growth, learning
    light: '#48C9B0', // Light teal - calm, peaceful
    dark: '#16A085', // Dark teal - professional, reliable
    accent: '#2ECC71', // Green accent - success, progress
  },

  // Secondary Colors - Supporting Elements
  secondary: {
    orange: '#FF9800', // Orange - creativity, enthusiasm
    green: '#4CAF50', // Green - success, achievement
    purple: '#9C27B0', // Purple - wisdom, knowledge
    indigo: '#3F51B5', // Indigo - focus, concentration
  },

  // Status Colors - Feedback & States
  status: {
    success: '#4CAF50', // Green - correct answers, completion
    warning: '#FF9800', // Orange - attention needed
    error: '#F44336', // Red - mistakes, errors
    info: '#1ABC9C', // Teal - information, tips
  },

  // Text Colors - Readability & Hierarchy
  text: {
    primary: '#212121', // Dark gray - main text
    secondary: '#757575', // Medium gray - secondary text
    disabled: '#BDBDBD', // Light gray - disabled text
    white: '#FFFFFF', // White text - on dark backgrounds
    placeholder: '#9E9E9E', // Placeholder text
  },

  // Background Colors - Surfaces & Containers
  background: {
    primary: '#FFFFFF', // White - main background
    secondary: '#F8F9FA', // Light gray - secondary background
    card: '#FFFFFF', // White - card backgrounds
    modal: '#FFFFFF', // White - modal backgrounds
    overlay: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
  },

  // Subject Colors - Different Study Areas
  subjects: {
    math: '#FF5722', // Red-orange - mathematics
    science: '#4CAF50', // Green - science
    language: '#9C27B0', // Purple - languages
    history: '#795548', // Brown - history
    art: '#E91E63', // Pink - arts
    music: '#FF9800', // Orange - music
    sports: '#2196F3', // Blue - physical education
    computer: '#607D8B', // Blue-gray - computer science
  },

  // Difficulty Levels - Learning Progress
  difficulty: {
    beginner: '#4CAF50', // Green - easy, beginner
    intermediate: '#FF9800', // Orange - medium difficulty
    advanced: '#F44336', // Red - hard, advanced
    expert: '#9C27B0', // Purple - expert level
  },

  // Grade Colors - Academic Performance
  grades: {
    excellent: '#4CAF50', // Green - A grade (90-100%)
    good: '#8BC34A', // Light green - B grade (80-89%)
    average: '#FF9800', // Orange - C grade (70-79%)
    below: '#FF5722', // Red-orange - D grade (60-69%)
    fail: '#F44336', // Red - F grade (below 60%)
  },

  // UI Element Colors - Interactive Components
  ui: {
    border: '#E0E0E0', // Light gray - borders
    divider: '#E0E0E0', // Light gray - dividers
    shadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow
    ripple: 'rgba(26, 188, 156, 0.2)', // Touch feedback
    focus: '#1ABC9C', // Teal - focus state
    disabled: '#F5F5F5', // Very light gray - disabled state
  },

  // Chart Colors - Data Visualization
  chart: {
    teal: '#1ABC9C',
    blue: '#3498DB',
    green: '#4CAF50',
    orange: '#FF9800',
    red: '#F44336',
    purple: '#9C27B0',
    emerald: '#2ECC71',
    pink: '#E91E63',
    indigo: '#3F51B5',
  },

  // Dark Theme Colors - Night Mode Support
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#BB86FC',
    secondary: '#03DAC6',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    border: '#333333',
  },

  // Gradient Colors - Modern UI Effects
  gradients: {
    primary: ['#1ABC9C', '#48C9B0'],
    success: ['#4CAF50', '#8BC34A'],
    warning: ['#FF9800', '#FFC107'],
    education: ['#1ABC9C', '#2ECC71'],
    sunset: ['#FF6B6B', '#FFE66D'],
    ocean: ['#1ABC9C', '#3498DB'],
  },

  // Opacity Variants - Transparency Levels
  opacity: {
    high: 0.87, // High emphasis
    medium: 0.6, // Medium emphasis
    low: 0.38, // Low emphasis
    disabled: 0.12, // Disabled state
  },
};

// Color helper functions
export const ColorHelpers = {
  // Add opacity to any color
  withOpacity: (color: string, opacity: number): string => {
    if (color.startsWith('#')) {
      const alpha = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0');
      return color + alpha;
    }
    return color;
  },

  // Get subject color by name
  getSubjectColor: (subject: string): string => {
    const subjectLower = subject.toLowerCase();
    switch (subjectLower) {
      case 'math':
      case 'mathematics':
        return Colors.subjects.math;
      case 'science':
      case 'physics':
      case 'chemistry':
      case 'biology':
        return Colors.subjects.science;
      case 'english':
      case 'language':
      case 'literature':
        return Colors.subjects.language;
      case 'history':
      case 'geography':
        return Colors.subjects.history;
      case 'art':
      case 'drawing':
        return Colors.subjects.art;
      case 'music':
        return Colors.subjects.music;
      case 'sports':
      case 'pe':
        return Colors.subjects.sports;
      case 'computer':
      case 'programming':
      case 'it':
        return Colors.subjects.computer;
      default:
        return Colors.primary.main;
    }
  },

  // Get grade color by percentage
  getGradeColor: (percentage: number): string => {
    if (percentage >= 90) return Colors.grades.excellent;
    if (percentage >= 80) return Colors.grades.good;
    if (percentage >= 70) return Colors.grades.average;
    if (percentage >= 60) return Colors.grades.below;
    return Colors.grades.fail;
  },

  // Get difficulty color
  getDifficultyColor: (level: string): string => {
    switch (level.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return Colors.difficulty.beginner;
      case 'intermediate':
      case 'medium':
        return Colors.difficulty.intermediate;
      case 'advanced':
      case 'hard':
        return Colors.difficulty.advanced;
      case 'expert':
        return Colors.difficulty.expert;
      default:
        return Colors.difficulty.beginner;
    }
  },
};

export default Colors;
