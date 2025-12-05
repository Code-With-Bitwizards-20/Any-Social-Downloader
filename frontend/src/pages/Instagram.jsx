import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaInstagram,
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
  FaHeart,
  FaFileAudio,
  FaFileVideo,
} from "react-icons/fa";
import SEO from "../components/common/SEO";
import useDownload from "../hooks/useDownload";
import MobileAppPromo from "../components/common/MobileAppPromo";
import { memo } from "react";

const Instagram = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    await getVideoInfo(url, "instagram");
  };

  const handleReset = () => {
    setUrl("");
    resetState();
  };

  const formatViewCount = (count) => {
    if (!count || count <= 0) return "No view count available";
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
        className="bg-gradient-to-r from-pink-500 to-purple-600 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <motion.button
          className="flex items-center justify-between w-full px-6 py-5 text-left"
          aria-label="Toggle FAQ Answer"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ backgroundColor: "rgba(236, 72, 153, 0.05)" }}
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
        title="Instagram Video Downloader - Download Reels, Stories & Posts"
        description="Free Instagram video downloader. Download Instagram Reels, Stories, posts, and IGTV videos in HD quality. Extract MP3 audio from Instagram videos. Fast, secure, and easy to use."
        keywords="Instagram downloader, Instagram video download, download Instagram videos, Instagram reels downloader, Instagram story downloader, Instagram to MP4, Instagram to MP3, download Instagram Reels, Instagram video saver, IG downloader, Instagram MP4 download, Instagram story saver, IGTV downloader"
        url="/instagram"
      />

      <motion.div
        className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FaInstagram className="text-white text-4xl" />
              </motion.div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
              Instagram{" "}
              <span className="text-gradient bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Downloader
              </span>
            </h1>

            <p className="text-xl text-gray-800 max-w-3xl mx-auto leading-relaxed">
              Download Instagram videos, photos, stories, and reels in high
              quality. Fast, free, and secure downloads.
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
                  <FaInstagram className="text-pink-500 text-xl" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your Instagram URL here (posts, reels, stories)"
                  className="block w-full pl-16 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  type="submit"
                  aria-label="Get Video Info"
                  disabled={loading || !url.trim()}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
                      Get Media Info
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
                              src={`/api/instagram/thumbnail?url=${encodeURIComponent(
                                videoInfo.thumbnail
                              )}`}
                              alt={videoInfo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                              onError={(e) => {
                                console.error(
                                  "Instagram thumbnail failed to load via proxy"
                                );
                                // Hide the failed image and show placeholder
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display =
                                  "flex";
                              }}
                              onLoad={(e) => {
                                console.log(
                                  "Instagram thumbnail loaded successfully via proxy"
                                );
                                // Hide placeholder since image loaded
                                if (e.target.nextElementSibling) {
                                  e.target.nextElementSibling.style.display =
                                    "none";
                                }
                              }}
                            />
                          ) : null}
                          {/* Fallback placeholder */}
                          <div
                            className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center"
                            style={{
                              display: videoInfo.thumbnail ? "none" : "flex",
                            }}
                          >
                            <div className="text-center">
                              <FaInstagram className="text-pink-400 text-6xl mb-2 mx-auto" />
                              <p className="text-gray-600 text-sm font-medium">
                                Instagram Video
                              </p>
                              <p className="text-gray-500 text-xs mt-1">
                                Loading thumbnail...
                              </p>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              className="w-16 h-16 bg-pink-500/90 rounded-full flex items-center justify-center shadow-lg"
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
                              <FaUser className="text-pink-500" />
                              <span className="truncate">
                                {videoInfo.author}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaHeart className="text-red-500" />
                              <span>
                                {formatViewCount(videoInfo.viewCount)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaClock className="text-purple-500" />
                              <span>
                                {formatDuration(videoInfo.lengthSeconds)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaCalendar className="text-orange-500" />
                              <span>{formatDate(videoInfo.publishDate)}</span>
                            </div>
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

          {/* Download Tabs */}
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
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaVideo />
                        <span>Video MP4</span>
                      </motion.button>

                      <motion.button
                        onClick={() => switchTab("audio")}
                        aria-label="Select Audio MP3 Tab"
                        className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          activeTab === "audio"
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaMusic />
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
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl">
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
                                <span>
                                  {formatFileSize(
                                    format.contentLength || format.filesize
                                  )}
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
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaDownload />
                            <span>Download</span>
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

          {/* Features Section */}
          <motion.div
            className="max-w-4xl mx-auto mt-16"
            variants={itemVariants}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Instagram Download Features
              </h2>
              <p className="text-lg text-gray-700">
                What you can do with our Instagram downloader
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: FaVideo,
                  title: "Videos & Reels",
                  description:
                    "Download Instagram videos and reels in HD quality",
                },
                {
                  icon: FaMusic,
                  title: "Photos & Stories",
                  description:
                    "Save Instagram photos and stories to your device",
                },
                {
                  icon: FaDownload,
                  title: "All Formats",
                  description:
                    "Support for posts, reels, IGTV, and story downloads",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl mx-auto mb-4">
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
              <p className="text-lg text-gray-700">
                Find answers to common questions about Instagram downloading
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "Is it legal to download Instagram content?",
                  answer:
                    "Downloading Instagram content for personal, offline viewing is generally acceptable. However, you should respect copyright laws and Instagram's Terms of Service. Do not redistribute downloaded content without permission from the original creator, and never use it for commercial purposes without authorization.",
                },
                {
                  question: "Can I download Instagram Stories?",
                  answer:
                    "Yes! Our downloader supports Instagram Stories. Simply copy the story URL (you may need to use a web browser to access the story link) and paste it into our downloader. Stories are available for download while they're still live (within 24 hours of posting).",
                },
                {
                  question: "How do I get the URL from Instagram?",
                  answer:
                    "For posts/reels: Tap the three dots (⋯) above the post and select 'Copy link'. For stories: Open the story, tap the three dots in the bottom right, and select 'Copy link'. On desktop: Right-click on the post date/time and select 'Copy link address'.",
                },
                {
                  question: "Can I download from private Instagram accounts?",
                  answer:
                    "No, our downloader only works with public Instagram content. To download from private accounts, you need to be an approved follower and logged into your Instagram account. We respect privacy settings and cannot access private content.",
                },
                {
                  question:
                    "What's the difference between downloading posts, reels, and stories?",
                  answer:
                    "Posts are permanent content on profiles, Reels are short-form videos (up to 90 seconds), and Stories are temporary content that disappears after 24 hours. Our downloader supports all these formats, but Stories must be downloaded while they're still active.",
                },
                {
                  question:
                    "Can I download Instagram photos as well as videos?",
                  answer:
                    "Yes! Our downloader supports both photos and videos from Instagram. When you paste a photo post URL, you'll be able to download the high-quality image. For carousel posts with multiple photos, you can download each image individually.",
                },
                {
                  question:
                    "Do I need an Instagram account to download content?",
                  answer:
                    "No Instagram account is required to download public content. However, for some content (like Stories from public accounts), you might need to be logged in to access the URL. Our downloader works without requiring your Instagram credentials.",
                },
                {
                  question: "What quality are the downloaded Instagram videos?",
                  answer:
                    "We download Instagram content in the highest available quality. For videos, this typically means up to 1080p resolution. For photos, we retrieve the highest resolution version available. Reels and Stories are downloaded in their original uploaded quality.",
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

export default memo(Instagram);
