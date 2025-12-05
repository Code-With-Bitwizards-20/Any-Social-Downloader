import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaLock,
  FaUserShield,
  FaEye,
  FaTrashAlt,
  FaCookie,
  FaEnvelope,
  FaExclamationTriangle,
} from "react-icons/fa";
import SEO from "../components/common/SEO";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileAppPromo from "../components/common/MobileAppPromo";
import { memo } from "react";

const PrivacyPolicy = () => {
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

  const privacyFeatures = [
    {
      icon: FaShieldAlt,
      title: "No Data Collection",
      description:
        "We don't collect, store, or share your personal information.",
    },
    {
      icon: FaLock,
      title: "Secure Processing",
      description:
        "All downloads are processed securely with end-to-end encryption.",
    },
    {
      icon: FaTrashAlt,
      title: "Auto-Delete",
      description:
        "Downloaded files are automatically deleted from our servers.",
    },
    {
      icon: FaUserShield,
      title: "Anonymous Usage",
      description:
        "Use our service completely anonymously without registration.",
    },
  ];

  return (
    <>
      <SEO
        title="Privacy Policy - Any Social Downloader | Data Protection & Security"
        description="Read our comprehensive Privacy Policy to understand how Any Social Downloader protects your privacy and secures your data. We don't store personal information, downloaded content, or track your activities. Learn about our data protection practices and commitment to user privacy."
        keywords="privacy policy, data protection, privacy, security, social media downloader, data security, user privacy, GDPR compliance, data collection, personal information, cookie policy, privacy terms, data retention, online privacy, secure downloader, privacy protection, no data storage, anonymous usage, privacy commitment, user data, information security, privacy guidelines, trust and safety, download privacy, video downloader privacy, social media privacy"
        url="/privacy"
      />
      <Header />

      <motion.div
        className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            className="text-center mb-16 pt-8"
            variants={itemVariants}
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FaShieldAlt className="text-white text-4xl" />
              </motion.div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              Privacy{" "}
              <span className="text-gradient bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
                Policy
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4">
              Your privacy is our top priority. This policy explains how we
              handle your data when you use Any Social Downloader.
            </p>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>Last updated:</span>
              <span className="font-semibold">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </motion.div>

          {/* Privacy Features */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
            variants={itemVariants}
          >
            {privacyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl mx-auto mb-4">
                  <feature.icon className="text-white text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Policy Content */}
          <motion.div
            className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-lg p-8 md:p-12 space-y-8"
            variants={itemVariants}
          >
            {/* Information We Collect */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaEye className="text-blue-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Information We Collect
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  <strong>We don't collect personal information.</strong> Any
                  Social Downloader is designed to work without requiring you to
                  provide any personal data such as your name, email, phone
                  number, or address.
                </p>
                <p>
                  <strong>Technical Information:</strong> We may collect minimal
                  technical information such as:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Browser type and version (for compatibility)</li>
                  <li>Operating system (for optimization)</li>
                  <li>IP address (automatically deleted after processing)</li>
                  <li>
                    URLs you submit for downloading (processed and immediately
                    discarded)
                  </li>
                </ul>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaLock className="text-green-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  How We Use Information
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  The minimal technical information we collect is used solely
                  to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Process your download requests</li>
                  <li>Ensure service compatibility with your device</li>
                  <li>Maintain and improve our service performance</li>
                  <li>Prevent abuse and ensure fair usage</li>
                </ul>
                <p>
                  <strong>
                    We never use this information for advertising, marketing, or
                    profiling purposes.
                  </strong>
                </p>
              </div>
            </section>

            {/* Data Storage and Security */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaUserShield className="text-purple-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Data Storage and Security
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  <strong>No Permanent Storage:</strong> We don't store
                  downloaded files on our servers. All files are processed in
                  real-time and streamed directly to your device.
                </p>
                <p>
                  <strong>Temporary Processing:</strong> URLs and metadata are
                  kept in memory only during the download process and are
                  immediately discarded afterward.
                </p>
                <p>
                  <strong>Security Measures:</strong> We use industry-standard
                  security measures including HTTPS encryption, secure server
                  configurations, and regular security audits.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaCookie className="text-orange-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Cookies and Tracking
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>We use minimal cookies only for essential functionality:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Session cookies:</strong> To maintain your download
                    session
                  </li>
                  <li>
                    <strong>Preference cookies:</strong> To remember your
                    quality preferences
                  </li>
                </ul>
                <p>
                  <strong>
                    We don't use tracking cookies, advertising cookies, or
                    analytics cookies that collect personal information.
                  </strong>
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaExclamationTriangle className="text-red-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Third-Party Services
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Any Social Downloader may interact with third-party platforms
                  (YouTube, Facebook, etc.) to process your download requests.
                  We don't share any personal information with these platforms.
                </p>
                <p>
                  <strong>CDN Services:</strong> We use content delivery
                  networks to ensure fast downloads. These services may log IP
                  addresses for security purposes, but this data is not linked
                  to you personally.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaUserShield className="text-blue-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Rights
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Since we don't collect personal information, most data
                  protection rights don't apply. However:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You can use our service completely anonymously</li>
                  <li>You can disable cookies in your browser settings</li>
                  <li>You can contact us with any privacy concerns</li>
                </ul>
              </div>
            </section>

            {/* Updates to Policy */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaEnvelope className="text-gray-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Updates to This Policy
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  We may update this Privacy Policy occasionally to reflect
                  changes in our practices or legal requirements. Any changes
                  will be posted on this page with an updated date.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-4">
                Questions About Privacy?
              </h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our
                privacy practices, please don't hesitate to contact us.
              </p>
              <motion.a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaEnvelope className="mr-2" />
                Contact Us
              </motion.a>
            </section>
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

export default memo(PrivacyPolicy);
