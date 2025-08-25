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

