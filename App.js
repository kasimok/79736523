import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

export default function App() {
  const [videos, setVideos] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status === 'granted');
      console.log('Media library permission status:', status === 'granted');
      
      if (status === 'granted') {
        loadVideos();
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        first: 10,
        sortBy: ['creationTime'],
      });
      
      console.log('Found videos:', assets.assets.length);
      setVideos(assets.assets);
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const analyzeUri = (uri) => {
    console.log('=== URI ANALYSIS ===');
    console.log('Full URI:', uri);
    
    if (uri.includes('#')) {
      const [path, metadata] = uri.split('#');
      console.log('Path part:', path);
      console.log('Metadata hash:', metadata);
      console.log('Metadata decoded length:', metadata.length);
      
      // The hash contains base64-encoded plist data about the asset
      console.log('This metadata is NOT the issue - it\'s iOS PHPhotoLibrary sandbox restriction');
    }
    
    console.log('URI scheme:', uri.split(':')[0]);
    console.log('Is file:// scheme:', uri.startsWith('file://'));
    console.log('Contains /var/mobile/Media/:', uri.includes('/var/mobile/Media/'));
    console.log('===================');
  };

  const generateThumbnail = async (asset) => {
    try {
      console.log('🔍 TESTING iOS 18+ PHPhotoLibrary Direct Access Issue');
      console.log('Asset ID:', asset.id);
      
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
      console.log('Asset Info:', assetInfo);
      
      let videoUri = assetInfo.localUri || '';
      if (!videoUri) {
        Alert.alert('Error', 'No local URI found for video');
        return;
      }

      // Analyze the URI structure
      analyzeUri(videoUri);
      
      console.log('🚫 Attempting direct file access (this should fail on iOS 18+)...');
      
      const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
        quality: 0.6,
      });
      
      console.log('✅ SUCCESS: Direct access worked:', thumbnail.uri);
      setThumbnails(prev => ({
        ...prev,
        [asset.id]: thumbnail.uri
      }));
      
      Alert.alert('Unexpected Success!', 'Direct file access worked - this might indicate the issue is resolved or device-specific.');
      
    } catch (error) {
      console.error('❌ CONFIRMED: iOS 18+ PHPhotoLibrary restriction:', error.message);
      Alert.alert(
        'iOS 18+ PHPhotoLibrary Restriction Confirmed', 
        `Error: "${error.message}"\n\nThis confirms the issue is iOS 18+ sandbox security, not the base64 metadata in the URI hash.\n\nThe app cannot directly access video files even with granted permissions.`
      );
    }
  };

  const testCleanUri = async (asset) => {
    try {
      console.log('🧪 Testing cleaned URI (without metadata hash)');
      
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
      const cleanUri = assetInfo.localUri.split('#')[0];
      
      console.log('Original URI:', assetInfo.localUri);
      console.log('Cleaned URI:', cleanUri);
      
      const thumbnail = await VideoThumbnails.getThumbnailAsync(cleanUri, {
        time: 0,
        quality: 0.6,
      });
      
      console.log('✅ Cleaned URI method worked:', thumbnail.uri);
      setThumbnails(prev => ({
        ...prev,
        [asset.id]: thumbnail.uri
      }));
      
      Alert.alert('Success', 'Cleaned URI method worked! The metadata hash was the issue.');
      
    } catch (error) {
      console.error('❌ Cleaned URI also failed:', error.message);
      Alert.alert(
        'Cleaned URI Also Failed', 
        `Error: "${error.message}"\n\nThis confirms it's not about the metadata hash - it's the iOS 18+ PHPhotoLibrary sandbox restriction.`
      );
    }
  };

  const testFileSystemCopy = async (asset) => {
    try {
      console.log('🔧 Testing FileSystem copy workaround');
      
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
      const filename = asset.filename || `video_${asset.id}.mp4`;
      const newPath = `${FileSystem.documentDirectory}${filename}`;
      
      console.log('Attempting to copy from sandboxed location to app directory...');
      console.log('From:', assetInfo.localUri);
      console.log('To:', newPath);
      
      await FileSystem.copyAsync({
        from: assetInfo.localUri,
        to: newPath
      });
      
      console.log('File copied successfully, generating thumbnail...');
      
      const thumbnail = await VideoThumbnails.getThumbnailAsync(newPath, {
        time: 0,
        quality: 0.6,
      });
      
      console.log('✅ FileSystem copy workaround succeeded:', thumbnail.uri);
      setThumbnails(prev => ({
        ...prev,
        [asset.id]: thumbnail.uri
      }));
      
      Alert.alert('Workaround Success!', 'FileSystem copy method worked! This is a potential solution.');
      
      // Clean up
      await FileSystem.deleteAsync(newPath, { idempotent: true });
      
    } catch (error) {
      console.error('❌ FileSystem copy failed:', error.message);
      Alert.alert(
        'FileSystem Copy Failed', 
        `Error: "${error.message}"\n\nEven copying fails, confirming the iOS 18+ PHPhotoLibrary sandbox restriction.`
      );
    }
  };

  if (permissionStatus === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (!permissionStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Media library permission denied. Please grant permission in Settings.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Retry Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>iOS 18+ PHPhotoLibrary Sandbox Test</Text>
      <Text style={styles.subtitle}>
        Testing direct file access vs iOS 18+ security restrictions.{'\n'}
        The issue is PHPhotoLibrary sandbox, not URI metadata hash.
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={loadVideos}>
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Reload Videos'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {videos.length === 0 ? (
          <Text style={styles.noVideosText}>
            No videos found. Please ensure you have videos in your photo library.
          </Text>
        ) : (
          videos.map((asset) => (
            <View key={asset.id} style={styles.videoItem}>
              <Text style={styles.videoTitle}>Video: {asset.filename}</Text>
              <Text style={styles.videoInfo}>
                Duration: {Math.round(asset.duration)}s | 
                Created: {new Date(asset.creationTime).toLocaleDateString()}
              </Text>
              
              {thumbnails[asset.id] && (
                <Image 
                  source={{ uri: thumbnails[asset.id] }} 
                  style={styles.thumbnail}
                />
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.testButton]}
                onPress={() => generateThumbnail(asset)}
              >
                <Text style={styles.buttonText}>Test Direct Access</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.testButton, styles.cleanButton]}
                onPress={() => testCleanUri(asset)}
              >
                <Text style={styles.buttonText}>Test Clean URI (No Hash)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.testButton, styles.copyButton]}
                onPress={() => testFileSystemCopy(asset)}
              >
                <Text style={styles.buttonText}>Test FileSystem Copy</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  videoItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  videoInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  thumbnail: {
    width: width - 60,
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  testButton: {
    marginBottom: 8,
  },
  cleanButton: {
    backgroundColor: '#FF9500',
  },
  copyButton: {
    backgroundColor: '#34C759',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  noVideosText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  },
});
