import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaTwitter,
  FaDownload,
  FaVideo,
  FaMusic,
  FaSpinner,
  FaExclamationTriangle,
  FaPlay,
  FaUser,
  FaEye,
  FaClock,
  FaCalendar,
  FaFileVideo,
  FaFileAudio,
} from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import SEO from "../components/common/SEO";
import useDownload from "../hooks/useDownload";
import MobileAppPromo from "../components/common/MobileAppPromo";
import { memo } from "react";

const Twitter = () => {
  const [url, setUrl] = useState("");

  // Helper functions
  const formatViewCount = (views) => {
    if (!views || views === 0) return "No views";

    if (views >= 1000000000) {
      return Math.floor(views / 1000000000) + "B views";
    } else if (views >= 1000000) {
      return Math.floor(views / 1000000) + "M views";
    } else if (views >= 1000) {
      return Math.floor(views / 1000) + "K views";
    } else {
      return views.toLocaleString() + " views";
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    await getVideoInfo(url, "twitter");
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

  // FAQ Item Component
  const FAQItem = memo(({ question, answer, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <motion.div
        className="bg-gradient-to-r from-blue-500 to-sky-600 rounded-2xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <motion.button
          className="flex items-center justify-between w-full px-6 py-5 text-left"
          aria-label="Toggle FAQ Answer"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-lg font-semibold text-white pr-4">
            {question}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <svg
              className="w-6 h-6 text-white"
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
                <p className="text-blue-50 leading-relaxed">{answer}</p>
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
        title="Twitter Video Downloader - Download X.com Videos & GIFs"
        description="Free Twitter/X video downloader. Download Twitter videos, GIFs, and media from both Twitter.com and X.com links in HD quality. Extract MP3 audio from Twitter videos. Fast, secure, and easy to use."
        keywords="Twitter downloader, Twitter video download, download Twitter videos, X video downloader, Twitter GIF downloader, X.com downloader, Twitter to MP4, Twitter to MP3, download X videos, Twitter video saver, X.com video download, Twitter MP4 download, Twitter audio extractor"
        url="/twitter"
      />

      <motion.div
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-400 to-sky-500 rounded-3xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FaTwitter className="text-white text-4xl" />
              </motion.div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
              Twitter{" "}
              <span className="text-gradient bg-gradient-to-r from-blue-400 to-sky-500 bg-clip-text text-transparent">
                Downloader
              </span>
            </h1>

            <p className="text-xl text-gray-800 max-w-3xl mx-auto leading-relaxed">
              Download Twitter videos and GIFs in high quality. Works with both
              Twitter.com and X.com links.
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
                  <FaTwitter className="text-blue-400 text-xl" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your Twitter/X video URL here (twitter.com or x.com)"
                  className="block w-full pl-16 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  type="submit"
                  aria-label="Get Video Info"
                  disabled={loading || !url.trim()}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-400 to-sky-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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

          {/* Video Information Section */}
          <AnimatePresence mode="wait">
            {videoInfo && (
              <motion.div
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
                          {videoInfo.thumbnail ? (
                            <img
                              src={videoInfo.thumbnail}
                              alt={videoInfo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
                              <div className="text-center">
                                <FaTwitter className="text-blue-400 text-6xl mb-2 mx-auto" />
                                <p className="text-blue-600 text-sm font-medium">
                                  Twitter Video
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              className="w-16 h-16 bg-blue-500/90 rounded-full flex items-center justify-center shadow-lg"
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FaVideo className="text-white text-xl ml-1" />
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
                              <FaUser className="text-blue-400" />
                              <span className="truncate">
                                {videoInfo.author}
                              </span>
                            </div>
                            {videoInfo.viewCount > 0 && (
                              <div className="flex items-center space-x-2">
                                <FaEye className="text-green-500" />
                                <span>
                                  {formatViewCount(videoInfo.viewCount)}
                                </span>
                              </div>
                            )}
                            {videoInfo.lengthSeconds > 0 && (
                              <div className="flex items-center space-x-2">
                                <FaClock className="text-purple-500" />
                                <span>
                                  {formatDuration(videoInfo.lengthSeconds)}
                                </span>
                              </div>
                            )}
                            {videoInfo.publishDate && (
                              <div className="flex items-center space-x-2">
                                <FaCalendar className="text-orange-500" />
                                <span>{formatDate(videoInfo.publishDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {videoInfo.description && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                              Description
                            </h3>
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

          {/* Download Section */}
          <AnimatePresence mode="wait">
            {videoInfo && (
              <motion.div
                className="max-w-5xl mx-auto mb-12"
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
                            ? "bg-gradient-to-r from-blue-400 to-sky-500 text-white shadow-md"
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
                            ? "bg-gradient-to-r from-blue-400 to-sky-500 text-white shadow-md"
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
                        key={`${activeTab}-${
                          format.itag || format.bitrate || index
                        }-${index}`}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-400 to-sky-500 rounded-xl">
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
                                <span>
                                  {activeTab === "video"
                                    ? "video/mp4"
                                    : "audio/mp3"}
                                </span>
                                <span>•</span>
                                <span>
                                  {formatFileSize(format.contentLength)}
                                </span>
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
                            onClick={() => handleDownload(format)}
                            aria-label="Download Selected Format"
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-400 to-sky-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaDownload className="text-lg" />
                            <span>Download</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl text-gray-300 mb-4">
                        {activeTab === "video" ? "📹" : "🎵"}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        No {activeTab} formats available
                      </h3>
                      <p className="text-gray-500">
                        Try a different video or check back later.
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features Section */}
          <motion.div
            className="max-w-4xl mx-auto mt-16"
            variants={itemVariants}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Twitter Download Features
              </h2>
              <p className="text-lg text-gray-600">
                What you can do with our Twitter downloader
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: FaVideo,
                  title: "HD Videos",
                  description:
                    "Download Twitter videos in the highest quality available",
                },
                {
                  icon: FaMusic,
                  title: "GIFs & Media",
                  description: "Save Twitter GIFs and other media content",
                },
                {
                  icon: FaDownload,
                  title: "X.com Support",
                  description: "Works with both Twitter.com and X.com links",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-sky-500 text-white rounded-2xl mx-auto mb-4">
                    <item.icon className="text-2xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQ Section - Added at the end */}
          <motion.div
            className="max-w-4xl mx-auto mt-20"
            variants={itemVariants}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-800">
                Find answers to common questions about Twitter/X video
                downloading
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "Is it legal to download Twitter/X videos?",
                  answer:
                    "Downloading Twitter/X videos for personal, offline viewing is generally acceptable. However, you should respect copyright laws and Twitter's Terms of Service. Do not redistribute downloaded content without permission from the original creator, and never use it for commercial purposes without authorization.",
                },
                {
                  question:
                    "Does this work with both Twitter.com and X.com links?",
                  answer:
                    "Yes! Our downloader supports both Twitter.com and the new X.com domain links. The platform transition from Twitter to X doesn't affect our downloader's functionality - both types of URLs work perfectly.",
                },
                {
                  question: "How do I get the video URL from Twitter/X?",
                  answer:
                    "On the web: Click the 'Share' button (the upward arrow icon) on the tweet and select 'Copy link'. In the mobile app: Tap the 'Share' icon and select 'Copy link'. The URL will look like: https://twitter.com/username/status/... or https://x.com/username/status/...",
                },
                {
                  question:
                    "Can I download videos from private Twitter accounts?",
                  answer:
                    "No, our downloader only works with public Twitter/X content. Videos from private accounts, protected tweets, or content that requires login to view cannot be downloaded. We respect user privacy and platform guidelines.",
                },
                {
                  question: "What video quality are Twitter/X downloads?",
                  answer:
                    "We download Twitter/X videos in the highest available quality. Twitter typically provides videos in multiple resolutions, and our downloader will show you all available options including HD quality when available.",
                },
                {
                  question: "Can I download GIFs from Twitter/X?",
                  answer:
                    "Yes! Our downloader supports downloading GIFs from Twitter/X. When you paste a tweet URL containing a GIF, you'll be able to download it as an MP4 video file, which maintains the animation quality.",
                },
                {
                  question: "Do I need a Twitter/X account to download videos?",
                  answer:
                    "No Twitter/X account is required to download public videos. You can view and copy public tweet URLs without being logged in, and our downloader works without requiring any login credentials.",
                },
                {
                  question:
                    "Is there a limit on video length I can download from Twitter?",
                  answer:
                    "Twitter/X allows videos up to 140 seconds (2 minutes 20 seconds) for most users, and up to 10 minutes for some verified accounts. Our downloader supports videos of any length within Twitter's limits.",
                },
              ].map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  index={index}
                />
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

export default memo(Twitter);
