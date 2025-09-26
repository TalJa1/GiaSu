// Google Sign-In Configuration
// Replace with your actual Web Client ID from Google Cloud Console
export const GOOGLE_WEB_CLIENT_ID =
  '647857472706-f4mnbpbn385b1g58sdalgcqjdusc7kjn.apps.googleusercontent.com';

// Note: For @react-native-google-signin/google-signin, you only need webClientId
// The Android client ID is automatically handled by Google Play Services

export const GoogleSignInConfig = {
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true, // Enable offline access for better token handling
  hostedDomain: '',
  forceCodeForRefreshToken: true, // Force refresh token for release builds
};
