// Google Sign-In Configuration
// Replace with your actual Web Client ID from Google Cloud Console
export const GOOGLE_WEB_CLIENT_ID = '647857472706-f4mnbpbn385b1g58sdalgcqjdusc7kjn.apps.googleusercontent.com';

// You can get this from:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing one
// 3. Enable Google+ API
// 4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
// 5. Create a Web application client ID
// 6. Copy the Client ID and replace the value above

export const GoogleSignInConfig = {
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
};
