import { motion } from "framer-motion";
import {
  FaDownload,
  FaRocket,
  FaShieldAlt,
  FaHeart,
  FaUsers,
  FaGlobe,
  FaCode,
  FaMobile,
  FaLightbulb,
} from "react-icons/fa";
import SEO from "../components/common/SEO";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileAppPromo from "../components/common/MobileAppPromo";
import { memo } from "react";

const AboutUs = () => {
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

  const stats = [
    { icon: FaUsers, number: "10M+", label: "Happy Users" },
    { icon: FaDownload, number: "50M+", label: "Downloads" },
    { icon: FaGlobe, number: "150+", label: "Countries" },
    { icon: FaShieldAlt, number: "100%", label: "Secure" },
  ];

  const features = [
    {
      icon: FaRocket,
      title: "Lightning Fast",
      description:
        "Download videos and audio at incredible speeds with our optimized servers.",
    },
    {
      icon: FaShieldAlt,
      title: "Completely Secure",
      description:
        "Your privacy matters. We don't store your data or downloaded content.",
    },
    {
      icon: FaMobile,
      title: "Mobile Friendly",
      description:
        "Works perfectly on all devices - desktop, tablet, and mobile.",
    },
    {
      icon: FaLightbulb,
      title: "Smart Technology",
      description:
        "Advanced algorithms ensure the best quality downloads every time.",
    },
  ];

  return (
    <>
      <SEO
        title="About Us - Any Social Downloader | Free Video & Audio Downloader"
        description="Learn about Any Social Downloader - the leading free online platform for downloading videos and audio from YouTube, Facebook, Instagram, TikTok, and Twitter/X. Discover our mission, features, and commitment to providing fast, secure, and high-quality downloads without watermarks."
        keywords="about us, video downloader, social media downloader, download videos, company info, YouTube downloader, Facebook downloader, Instagram downloader, TikTok downloader, Twitter downloader, free video download, MP4 downloader, MP3 converter, HD video download, no watermark download, online video saver, social media video download, audio extractor, video converter, about our team, download platform, free service, secure downloader, fast video download, social media tools"
        url="/about"
      />

      <Header />

      <motion.div
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            className="text-center mb-16 pt-8"
            variants={itemVariants}
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FaDownload className="text-white text-4xl" />
              </motion.div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              About{" "}
              <span className="text-gradient bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Any Social Downloader
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We're passionate about making social media content accessible to
              everyone. Our mission is to provide the fastest, most secure, and
              user-friendly platform for downloading videos and audio from your
              favorite social media platforms.
            </p>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
            variants={itemVariants}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mx-auto mb-4">
                  <stat.icon className="text-white text-2xl" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Story Section */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16"
            variants={itemVariants}
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded in 2020 Code With Bitwizards, Any Social Downloader
                  was born from a simple idea: everyone should have easy access
                  to the content they love, whenever and wherever they want it.
                </p>
                <p>
                  We noticed that downloading videos and audio from social media
                  platforms was often complicated, slow, or required installing
                  suspicious software. That's when we decided to create a better
                  solution.
                </p>
                <p>
                  Today, we're proud to serve millions of users worldwide,
                  providing fast, secure, and reliable downloads from YouTube,
                  Facebook, Instagram, TikTok, Twitter, and more platforms.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-96 h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <div className="text-center text-white">
                    <FaHeart className="text-6xl mx-auto mb-4" />
                    <p className="text-xl font-semibold">Made with Love</p>
                    <p className="text-sm opacity-90">
                      for millions of users worldwide
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div className="mb-16" variants={itemVariants}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose Us?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We're committed to providing the best downloading experience
                with these key features
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg"
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mx-auto mb-4">
                    <feature.icon className="text-white text-2xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mission Section */}
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white mb-16"
            variants={itemVariants}
          >
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl leading-relaxed max-w-4xl mx-auto mb-8">
              To democratize access to digital content by providing fast,
              secure, and user-friendly tools that respect user privacy while
              delivering exceptional downloading experiences across all social
              media platforms.
            </p>
            <motion.div
              className="flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <FaCode className="text-2xl" />
              <span className="text-lg font-semibold">
                Built by Code With Bitwizards
              </span>
            </motion.div>
          </motion.div>

          {/* Team Section */}
          <motion.div className="text-center" variants={itemVariants}>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Have questions, suggestions, or just want to say hi? We'd love to
              hear from you!
            </p>
            <motion.a
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Contact Us
            </motion.a>
          </motion.div>
        </div>
      </motion.div>

      <Footer />

      <div className="hidden sm:block">
        <MobileAppPromo />
      </div>
    </>
  );
};

export default memo(AboutUs);
