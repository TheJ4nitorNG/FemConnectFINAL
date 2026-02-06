# FemConnect App Store Submission Guide

This guide provides step-by-step instructions for submitting FemConnect to the Apple App Store.

## Prerequisites

- Mac computer with Xcode installed (latest version recommended)
- Apple Developer account ($99/year)
- FemConnect codebase downloaded to your Mac

## Step 1: Set Up Your Development Environment

1. Install Node.js (v18 or higher) from https://nodejs.org
2. Install Xcode from the Mac App Store
3. Open Xcode and install additional components when prompted
4. Install CocoaPods: `sudo gem install cocoapods`

## Step 2: Build the Web App

```bash
# Navigate to project directory
cd femconnect

# Install dependencies
npm install

# Build the production version
npm run build
```

## Step 3: Initialize iOS Platform

```bash
# Initialize Capacitor iOS platform
npx cap add ios

# Sync web assets to iOS
npx cap sync ios
```

## Step 4: Configure iOS Project

1. Open the iOS project:
   ```bash
   npx cap open ios
   ```

2. In Xcode, select the App target and configure:
   - **Bundle Identifier**: `com.femconnect.app`
   - **Display Name**: FemConnect
   - **Version**: 1.0.0
   - **Build**: 1

3. Select your Development Team in Signing & Capabilities

## Step 5: Configure App Capabilities

In Xcode, go to Signing & Capabilities and add:
- Push Notifications (optional, for future use)
- Associated Domains (if using universal links)

## Step 6: Add App Icons

The icons are already generated in `client/public/icons/`. To add them to Xcode:

1. Open `ios/App/App/Assets.xcassets`
2. Click on AppIcon
3. Drag the appropriate sized icons to each slot:
   - 40x40 (2x) → Use icon-72x72.png
   - 60x60 (2x) → Use icon-128x128.png
   - 60x60 (3x) → Use icon-192x192.png
   - 1024x1024 → Use icon-512x512.png (or generate a 1024px version)

## Step 7: Configure Info.plist

Add these required keys to `ios/App/App/Info.plist`:

```xml
<!-- Camera usage for profile photos -->
<key>NSCameraUsageDescription</key>
<string>FemConnect needs camera access to take profile photos</string>

<!-- Photo library for uploading profile pictures -->
<key>NSPhotoLibraryUsageDescription</key>
<string>FemConnect needs photo library access to upload profile pictures</string>

<!-- Location (if used) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>FemConnect uses your location to find nearby members</string>
```

## Step 8: Test on Device

1. Connect an iPhone to your Mac
2. Select your device in Xcode
3. Press ⌘+R to build and run
4. Test all features thoroughly

## Step 9: Create App Store Screenshots

Take screenshots on these device sizes:
- iPhone 6.7" (iPhone 15 Pro Max)
- iPhone 6.5" (iPhone 11 Pro Max)
- iPhone 5.5" (iPhone 8 Plus)
- iPad Pro 12.9" (if supporting iPad)

Required screenshots for key screens:
1. Landing/Login page
2. User profile
3. Browse members
4. Messaging
5. Match questions

## Step 10: Prepare App Store Metadata

### App Information
- **App Name**: FemConnect
- **Subtitle**: Dating & Social for Femboys
- **Category**: Social Networking
- **Age Rating**: 17+ (Dating/Mature themes)

### Description
```
FemConnect is a safe, inclusive dating and social community designed specifically for femboys and their admirers.

Features:
• Verified 18+ community for your safety
• Detailed profiles with photos and interests
• Match questions to find compatible connections
• Private messaging system
• Profile customization with pronouns and preferences
• Safety tips and community guidelines

Whether you're looking for friendship, dating, or just a welcoming community, FemConnect provides a judgment-free space to be yourself.

Join thousands of members who have found their perfect connections on FemConnect!
```

### Keywords
```
femboy, dating, lgbtq, social, community, friends, chat, meet, connections, inclusive
```

### Privacy Policy URL
```
https://your-domain.replit.app/privacy
```

### Support URL
```
https://your-domain.replit.app
```

## Step 11: Archive and Upload

1. In Xcode, select "Any iOS Device" as the build target
2. Go to Product → Archive
3. Once complete, click "Distribute App"
4. Select "App Store Connect"
5. Follow the prompts to upload

## Step 12: Submit for Review

1. Log in to App Store Connect (https://appstoreconnect.apple.com)
2. Create a new app with your Bundle ID
3. Fill in all metadata, screenshots, and descriptions
4. Add the uploaded build
5. Complete the App Review Information section
6. Submit for review

## App Review Tips

Apple may reject apps for:
- Missing privacy policy
- Incomplete functionality
- Bugs or crashes
- Inappropriate content not properly age-gated

Make sure:
- The app works offline or shows appropriate error messages
- All links work (privacy policy, terms of service)
- Age verification is prominently displayed
- Content moderation is in place

## Estimated Timeline

- App preparation: 1-2 days
- Build and test: 1 day
- App Store review: 1-7 days (typically 24-48 hours)

## Offline Support Note

The current service worker implementation uses a cache-first strategy for static assets and caches content after the first visit. For full offline support on first load, you may want to integrate Workbox during the build process:

1. Install Workbox: `npm install workbox-build`
2. Add a build script to generate a precache manifest
3. Update the service worker to use Workbox's precaching

The current implementation provides:
- Offline access after the first visit
- Cached static assets (JS, CSS, images, fonts)
- Offline fallback page when completely disconnected

## Server Configuration

Before submitting, ensure your production server is ready:

1. Update the API URL in the Capacitor config if needed
2. Ensure HTTPS is enabled
3. Test push notifications (if implemented)
4. Verify email notifications work

## Support

For issues with the build process, check:
- Capacitor docs: https://capacitorjs.com/docs/ios
- Apple Developer docs: https://developer.apple.com/documentation/

---

Good luck with your App Store submission!
