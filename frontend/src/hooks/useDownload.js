import { useState } from 'react';
import { youtubeApi, facebookApi, instagramApi, tiktokApi, twitterApi, API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';

export const useDownload = () => {
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [formats, setFormats] = useState({ audio: [], video: [] });
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [activeTab, setActiveTab] = useState('video'); // 'video' or 'audio'
  const [currentPlatform, setCurrentPlatform] = useState('youtube');
  const [lastUrl, setLastUrl] = useState('');

  const resetState = () => {
    setVideoInfo(null);
    setFormats({ audio: [], video: [] });
    setSelectedFormat(null);
    setActiveTab('video');
  };

  const getVideoInfo = async (url, platform = 'youtube') => {
    setCurrentPlatform(platform);
    setLastUrl(url);
    if (!url || !url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      // Handle different platforms
      switch (platform) {
        case 'youtube':
          response = await youtubeApi.getVideoInfo(url.trim());
          break;
        case 'facebook':
          response = await facebookApi.getVideoInfo(url.trim());
          break;
        case 'instagram':
          response = await instagramApi.getMediaInfo(url.trim());
          break;
        case 'tiktok':
          response = await tiktokApi.getVideoInfo(url.trim());
          break;
        case 'twitter':
          response = await twitterApi.getMediaInfo(url.trim());
          break;
        default:
          toast.error('Unsupported platform');
          return;
      }

      if (response.success) {
        setVideoInfo(response.videoInfo);
        setFormats(response.formats);
        toast.success('Video information loaded successfully!');
      } else {
        throw new Error(response.error || 'Failed to get video information');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to get video information');
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (format, filename) => {
    try {
      if (!format) {
        toast.error('Invalid download format');
        return;
      }

      const encodedTitle = encodeURIComponent(filename || `download_${Date.now()}`);

      let downloadUrl = '';
      if (currentPlatform === 'youtube') {
        if (!lastUrl) {
          toast.error('Missing URL for YouTube download');
          return;
        }

        if (format.isTranscoded && format.bitrate) {
          downloadUrl = `${API_BASE_URL}/youtube/download-audio?url=${encodeURIComponent(lastUrl)}&bitrate=${format.bitrate}&title=${encodedTitle}`;
        } else if (format.merge && format.vItag && format.aItag) {
          downloadUrl = `${API_BASE_URL}/youtube/merge?url=${encodeURIComponent(lastUrl)}&vItag=${encodeURIComponent(format.vItag)}&aItag=${encodeURIComponent(format.aItag)}&title=${encodedTitle}`;
        } else if (format.itag) {
          downloadUrl = `${API_BASE_URL}/youtube/download?url=${encodeURIComponent(lastUrl)}&itag=${encodeURIComponent(format.itag)}&title=${encodedTitle}`;
        } else {
          toast.error('No valid itag for YouTube format');
          return;
        }
      } else if (currentPlatform === 'facebook') {
        if (!lastUrl) {
          toast.error('Missing URL for Facebook download');
          return;
        }

        if (format.isTranscoded && format.bitrate) {
          downloadUrl = `${API_BASE_URL}/facebook/download-audio?url=${encodeURIComponent(lastUrl)}&bitrate=${format.bitrate}&title=${encodedTitle}`;
        } else if (format.merge && format.vItag && format.aItag) {
          downloadUrl = `${API_BASE_URL}/facebook/merge?url=${encodeURIComponent(lastUrl)}&vItag=${encodeURIComponent(format.vItag)}&aItag=${encodeURIComponent(format.aItag)}&title=${encodedTitle}`;
        } else if (format.itag) {
          downloadUrl = `${API_BASE_URL}/facebook/download?url=${encodeURIComponent(lastUrl)}&itag=${encodeURIComponent(format.itag)}&title=${encodedTitle}`;
        } else {
          toast.error('No valid format for Facebook download');
          return;
        }
      } else if (currentPlatform === 'instagram') {
        if (!lastUrl) {
          toast.error('Missing URL for Instagram download');
          return;
        }

        if (format.isTranscoded && format.bitrate) {
          downloadUrl = `${API_BASE_URL}/instagram/download-audio?url=${encodeURIComponent(lastUrl)}&bitrate=${format.bitrate}&title=${encodedTitle}`;
        } else if (format.merge && format.vItag && format.aItag) {
          downloadUrl = `${API_BASE_URL}/instagram/merge?url=${encodeURIComponent(lastUrl)}&vItag=${encodeURIComponent(format.vItag)}&aItag=${encodeURIComponent(format.aItag)}&title=${encodedTitle}`;
        } else if (format.itag) {
          downloadUrl = `${API_BASE_URL}/instagram/download?url=${encodeURIComponent(lastUrl)}&itag=${encodeURIComponent(format.itag)}&title=${encodedTitle}`;
        } else {
          toast.error('No valid format for Instagram download');
          return;
        }
      } else if (currentPlatform === 'tiktok') {
        if (!lastUrl) {
          toast.error('Missing URL for TikTok download');
          return;
        }

        if (format.isTranscoded && format.bitrate) {
          downloadUrl = `${API_BASE_URL}/tiktok/download-audio?url=${encodeURIComponent(lastUrl)}&bitrate=${format.bitrate}&title=${encodedTitle}`;
        } else if (format.merge && format.vItag && format.aItag) {
          downloadUrl = `${API_BASE_URL}/tiktok/merge?url=${encodeURIComponent(lastUrl)}&vItag=${encodeURIComponent(format.vItag)}&aItag=${encodeURIComponent(format.aItag)}&title=${encodedTitle}`;
        } else if (format.itag) {
          downloadUrl = `${API_BASE_URL}/tiktok/download?url=${encodeURIComponent(lastUrl)}&itag=${encodeURIComponent(format.itag)}&title=${encodedTitle}`;
        } else {
          toast.error('No valid format for TikTok download');
          return;
        }
      } else if (currentPlatform === 'twitter') {
        if (!lastUrl) {
          toast.error('Missing URL for Twitter download');
          return;
        }

        if (format.isTranscoded && format.bitrate) {
          downloadUrl = `${API_BASE_URL}/twitter/download-audio?url=${encodeURIComponent(lastUrl)}&bitrate=${format.bitrate}&title=${encodedTitle}`;
        } else if (format.itag) {
          downloadUrl = `${API_BASE_URL}/twitter/download?url=${encodeURIComponent(lastUrl)}&itag=${encodeURIComponent(format.itag)}&title=${encodedTitle}`;
        } else {
          toast.error('No valid format for Twitter download');
          return;
        }
      }

      // Simple hidden anchor download (works reliably)
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started! Please wait a While - We are Preparing Files in Backend ....');

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to start download Try Again!');
    }
  };

  const getDownloadFilename = (format) => {
    if (!videoInfo) return `download_${Date.now()}`;
    
    const cleanTitle = videoInfo.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    if (activeTab === 'audio') {
      return `${cleanTitle}_${format.bitrate || 'audio'}.mp3`;
    } else {
      return `${cleanTitle}_${format.qualityLabel || format.quality || 'video'}.mp4`;
    }
  };

  const handleDownload = (format, type, platform) => {
    const filename = getDownloadFilename(format);
    downloadFile(format, filename);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === '0') return 'Unknown size';
    
    const size = parseInt(bytes);
    if (isNaN(size)) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSelectedFormat(null);
  };

  // Get formats for current active tab
  const getCurrentFormats = () => {
    if (!formats) return [];
    return activeTab === 'video' ? (formats.video || []) : (formats.audio || []);
  };

  return {
    // State
    loading,
    videoInfo,
    formats: formats, // Return full formats object with video and audio arrays
    selectedFormat,
    activeTab,
    
    // Actions
    getVideoInfo,
    handleDownload,
    resetState,
    switchTab,
    setSelectedFormat,
    
    // Utilities
    formatFileSize,
    formatDuration,
    getDownloadFilename,
    currentPlatform,
    lastUrl
  };
};

export default useDownload;
