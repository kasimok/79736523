# iOS 18.5 Video Thumbnail Demo

This is a demo app that reproduces the issue with `expo-video-thumbnails` and `expo-media-library` on iOS 18.5, where accessing local videos for thumbnail generation fails with permission errors.

## Problem Description

On iOS 18.5 (iPhone 11 Pro), when using `expo-media-library` and `expo-video-thumbnails`:

1. Media library permission is granted correctly
2. `MediaLibrary.getAssetInfoAsync()` returns a valid `localUri` 
3. `VideoThumbnails.getThumbnailAsync()` fails with: "The file couldn't be opened because you don't have permission to view it"
4. The issue occurs even though media library permissions are granted
5. If you preview the video in the app first, then thumbnail generation works

## Features

This demo app includes:

- ✅ Permission handling for media library access
- ✅ Loading videos from photo library  
- ✅ Attempting thumbnail generation (reproduces the issue)
- ✅ Error handling and logging
- ✅ Alternative methods to try different approaches
- ✅ Comprehensive logging for debugging

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on iOS device or simulator:
   ```bash
   npx expo start --ios
   ```

## Usage

1. Grant photo library permissions when prompted
2. Tap "Reload Videos" to load videos from your photo library
3. Tap "Generate Thumbnail" on any video to reproduce the issue
4. Tap "Try Alternative" to test alternative approaches

## Expected Behavior vs Actual

**Expected:** Thumbnail generation should work immediately after granting media library permissions.

**Actual on iOS 18.5:** Thumbnail generation fails with permission error, even though media library permission is granted.

## Workarounds Being Tested

The app tests several potential workarounds:

1. Using `asset.uri` instead of `assetInfo.localUri`
2. Different time parameters for thumbnail generation
3. Different quality settings
4. Checking for additional permission requirements

## Debugging Information

The app provides detailed console logs including:

- Permission status
- Asset information and URIs
- Exact error messages
- Success/failure states

Check the console output when testing to see the detailed error information.

## iOS Configuration

The app includes proper iOS configuration in `app.json`:

- `NSPhotoLibraryUsageDescription` for reading photos
- `NSPhotoLibraryAddUsageDescription` for saving photos  
- Media library plugin configuration
- Proper permissions setup

## Testing

To test this issue:

1. Ensure you have videos in your iOS photo library
2. Run the app on iOS 18.5+ device
3. Grant permissions when prompted
4. Try generating thumbnails from different videos
5. Observe the permission errors in console and alerts

This should help isolate and test potential solutions for the iOS 18.5 video thumbnail generation issue.
