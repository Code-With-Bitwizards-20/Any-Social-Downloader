import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaYoutube,
  FaDownload,
  FaVideo,
  FaMusic,
  FaPlay,
  FaEye,
  FaCalendar,
  FaUser,
  FaClock,
  FaFileAudio,
  FaFileVideo,
  FaSpinner,
} from "react-icons/fa";
import SEO from "../components/common/SEO";
import useDownload from "../hooks/useDownload";
import MobileAppPromo from "../components/common/MobileAppPromo";

const YouTube = () => {
  const [url, setUrl] = useState("");
  const {
    loading,
    videoInfo,
    formats,
    activeTab,
    getVideoInfo,
    handleDownload,
    resetState,
    switchTab,
    formatFileSize,
    formatDuration,
  } = useDownload();
  // Prevent duplicate download clicks that can abort streams
  const [downloadingKey, setDownloadingKey] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    await getVideoInfo(url, "youtube");
  };

  const handleReset = () => {
    setUrl("");
    resetState();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const formatViewCount = (count) => {
    if (!count) return "0 views";
    const num = parseInt(count);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B views`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num.toLocaleString()} views`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  const getFormatType = (format, tabType) => {
    if (tabType === "video") {
      return "video/mp4";
    } else if (tabType === "audio") {
      return "audio/mp3";
    }
    return format.mimeType?.split(";")[0] || "Unknown format";
  };

  // Stable unique key generator for format items
  const formatKey = (format, tabType, index) => {
    const parts = [
      tabType,
      format?.itag,
      format?.vItag,
      format?.aItag,
      format?.qualityLabel || format?.quality,
      format?.bitrate,
      format?.mimeType,
      format?.url,
      index, // final fallback to guarantee uniqueness
    ];
    return parts
      .filter((p) => p !== undefined && p !== null && String(p).length > 0)
      .map((p) => String(p))
      .join("|");
  };

  // FAQ Item Component
  const FAQItem = memo(({ question, answer, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <motion.div
        className="bg-gradient-to-r from-red-500 to-red-700 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-600 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <motion.button
          className="flex items-center justify-between w-full px-6 py-5 text-left"
          aria-label="Toggle FAQ Answer"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.05)" }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-lg font-semibold text-gray-950 pr-4">
            {question}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <svg
              className="w-6 h-6 text-white/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-5">
                <p className="text-gray-950 leading-relaxed">{answer}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  });

  return (
    <>
      <SEO
        title="YouTube Video Downloader - Download HD Videos & MP3 Audio"
        description="Free YouTube video downloader. Download YouTube videos in 144p to 1080p quality or extract MP3 audio from 96kbps to 320kbps. Fast, secure, and easy to use."
        keywords="YouTube downloader, YouTube to MP4, YouTube to MP3, download YouTube videos, YouTube video converter, HD YouTube downloader, YouTube audio extractor, free video downloader, YouTube 1080p download, YouTube MP3 converter"
        url="/youtube"
      />

      <motion.div
        className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FaYoutube className="text-white text-4xl" />
              </motion.div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
              YouTube{" "}
              <span className="text-gradient bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Downloader
              </span>
            </h1>

            <p className="text-xl text-gray-800 max-w-3xl mx-auto leading-relaxed">
              Download YouTube videos in high quality (HD, Full HD, 4K) or
              extract audio as MP3. Fast, free, and secure downloads with no
              limitations.
            </p>
          </motion.div>

          {/* URL Input Section */}
          <motion.div
            className="max-w-4xl mx-auto mb-12"
            variants={itemVariants}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <FaYoutube className="text-red-500 text-xl" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your YouTube video URL here (e.g., https://youtube.com/watch?v=...)"
                  className="block w-full pl-16 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  type="submit"
                  aria-label="Get Video Info"
                  disabled={loading || !url.trim()}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-3" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaDownload className="mr-3" />
                      Get Video Info
                    </>
                  )}
                </motion.button>

                {videoInfo && (
                  <motion.button
                    type="button"
                    aria-label="Reset Form"
                    onClick={handleReset}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    New Download
                  </motion.button>
                )}
              </div>
            </form>
          </motion.div>

          {/* Video Info Section */}
          <AnimatePresence mode="wait">
            {videoInfo && (
              <motion.div
                key="info"
                className="max-w-5xl mx-auto mb-12"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-gray-200">
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Video Thumbnail */}
                      <div className="lg:col-span-1">
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group">
                          <img
                            src={videoInfo.thumbnail}
                            alt={videoInfo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              className="w-16 h-16 bg-red-500/90 rounded-full flex items-center justify-center shadow-lg"
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FaPlay className="text-white text-xl ml-1" />
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      {/* Video Details */}
                      <div className="lg:col-span-2 space-y-6">
                        <div>
                          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-4">
                            {videoInfo.title}
                          </h2>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <FaUser className="text-red-500" />
                              <span className="truncate">{videoInfo.author}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaEye className="text-blue-500" />
                              <span>{formatViewCount(videoInfo.viewCount)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaClock className="text-green-500" />
                              <span>{formatDuration(videoInfo.lengthSeconds)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaCalendar className="text-purple-500" />
                              <span>{formatDate(videoInfo.publishDate)}</span>
                            </div>
                          </div>
                        </div>

                        {videoInfo.description && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                              {videoInfo.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Download Tabs */}
          <AnimatePresence mode="wait">
            {videoInfo && (
              <motion.div
                key="tabs"
                className="max-w-5xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Tab Buttons */}
                <div className="flex justify-center mb-8">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200">
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => switchTab("video")}
                        aria-label="Select Video MP4 Tab"
                        className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          activeTab === "video"
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaVideo className="text-lg" />
                        <span>Video MP4</span>
                      </motion.button>

                      <motion.button
                        onClick={() => switchTab("audio")}
                        aria-label="Select Audio MP3 Tab"
                        className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          activeTab === "audio"
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaMusic className="text-lg" />
                        <span>Audio MP3</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Format List */}
                <motion.div
                  className="space-y-4"
                  key={activeTab}
                  initial={{ opacity: 0, x: activeTab === "video" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {formats[activeTab]?.length > 0 ? (
                    formats[activeTab].map((format, index) => (
                      <motion.div
                        key={formatKey(format, activeTab, index)}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                              {activeTab === "video" ? (
                                <FaFileVideo className="text-white text-lg" />
                              ) : (
                                <FaFileAudio className="text-white text-lg" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-lg text-gray-900">
                                  {activeTab === "video"
                                    ? format.qualityLabel ||
                                      format.quality ||
                                      "Unknown Quality"
                                    : `${format.bitrate || "Unknown"} kbps`}
                                </span>
                                {format.fps && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                                    {format.fps}fps
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>{getFormatType(format, activeTab)}</span>
                                <span>•</span>
                                <span>{formatFileSize(format.contentLength)}</span>
                                {activeTab === "video" &&
                                  format.hasAudio === false && (
                                    <>
                                      <span>•</span>
                                      <span className="text-orange-600 font-medium">
                                        Video Only
                                      </span>
                                    </>
                                  )}
                              </div>
                            </div>
                          </div>

                          <motion.button
                            onClick={() => {
                              const key = formatKey(format, activeTab, index);
                              if (downloadingKey === key) return; // throttle duplicate click
                              setDownloadingKey(key);
                              try {
                                handleDownload(format);
                              } finally {
                                // Clear after a short delay to avoid immediate double-requests
                                setTimeout(() => setDownloadingKey(null), 4000);
                              }
                            }}
                            aria-label="Download Selected Format"
                            disabled={downloadingKey === formatKey(format, activeTab, index)}
                            className={`flex items-center space-x-2 px-6 py-3 font-semibold rounded-xl shadow-lg transition-all duration-300 ${
                              downloadingKey === formatKey(format, activeTab, index)
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaDownload />
                            <span>{downloadingKey === formatKey(format, activeTab, index) ? 'Preparing…' : 'Download'}</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className="text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-gray-400 text-lg">
                        No {activeTab} formats available
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* How to Use Section */}
          {!videoInfo && (
            <motion.div
              className="max-w-4xl mx-auto mt-16"
              variants={itemVariants}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  How to Download YouTube Videos
                </h2>
                <p className="text-lg text-gray-700">
                  Follow these simple steps to download any YouTube video
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: 1,
                    title: "Copy Video URL",
                    description:
                      "Go to YouTube and copy the video URL from the address bar",
                  },
                  {
                    step: 2,
                    title: "Paste & Analyze",
                    description:
                      "Paste the URL in the input field above and click 'Get Video Info'",
                  },
                  {
                    step: 3,
                    title: "Choose & Download",
                    description:
                      "Select your preferred format and quality, then click download",
                  },
                ].map((item, index) => (
                  <motion.div key={index} className="text-center" variants={itemVariants}>
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 text-white text-xl font-bold rounded-2xl mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* FAQ Section */}
          <motion.div className="max-w-4xl mx-auto mt-20" variants={itemVariants}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-700">
                Find answers to common questions about YouTube video downloading
              </p>
            </div>

            <div className="space-y-4 ">
              {[
                {
                  question: "Is it legal to download YouTube videos?",
                  answer:
                    "Downloading YouTube videos for personal, offline viewing is generally acceptable under YouTube's Terms of Service. However, distributing copyrighted content without permission or using downloaded videos for commercial purposes may violate copyright laws. Always respect content creators' rights and YouTube's policies.",
                },
                {
                  question: "What video qualities are available for download?",
                  answer:
                    "Our YouTube downloader supports video qualities ranging from 144p to 1080p HD, depending on the original video's available formats. Higher quality videos (720p, 1080p) are available for most recent YouTube uploads.",
                },
                {
                  question: "Can I download YouTube videos in MP3 format?",
                  answer:
                    "Yes! You can extract audio from any YouTube video and download it as MP3 files. We offer multiple audio quality options from 96kbps to 320kbps for the best listening experience.",
                },
                {
                  question: "How long does it take to download a video?",
                  answer:
                    "Download time depends on your internet speed and the video's size. Typically, a 10-minute HD video takes 30-60 seconds to process and download. Our servers are optimized for fast processing.",
                },
                {
                  question: "Do I need to install any software?",
                  answer:
                    "No installation required! Our YouTube downloader works directly in your web browser. It's completely web-based and works on all devices including Windows, Mac, Linux, and mobile devices.",
                },
                {
                  question: "Is there a limit on video length or size?",
                  answer:
                    "There are no strict limits on video length or size. You can download long videos, live streams, and 4K content. However, very large files may take longer to process depending on server load.",
                },
                {
                  question: "Can I download private or age-restricted videos?",
                  answer:
                    "No, our downloader only works with publicly available YouTube videos. Private, unlisted, or age-restricted videos that require login cannot be downloaded through our service.",
                },
                {
                  question: "How do I find the YouTube video URL?",
                  answer:
                    "Simply go to the YouTube video you want to download, copy the URL from your browser's address bar. It should look like: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID",
                },
              ].map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="hidden sm:block">
        <MobileAppPromo />
      </div>
    </>
  );
};

export default memo(YouTube);
