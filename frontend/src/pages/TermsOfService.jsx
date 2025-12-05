import { motion } from "framer-motion";
import {
  FaFileContract,
  FaCheckCircle,
  FaExclamationCircle,
  FaBan,
  FaGavel,
  FaUserCheck,
  FaShieldAlt,
  FaHandshake,
} from "react-icons/fa";
import SEO from "../components/common/SEO";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileAppPromo from "../components/common/MobileAppPromo";
import { memo } from "react";

const TermsOfService = () => {
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

  const termsHighlights = [
    {
      icon: FaUserCheck,
      title: "Free to Use",
      description: "Our service is completely free for personal use.",
    },
    {
      icon: FaCheckCircle,
      title: "Legal Content",
      description: "Only download content you have the right to download.",
    },
    {
      icon: FaShieldAlt,
      title: "Responsible Use",
      description: "Use our service responsibly and respect copyright laws.",
    },
    {
      icon: FaHandshake,
      title: "Fair Usage",
      description:
        "We ask for fair usage to ensure service availability for everyone.",
    },
  ];

  return (
    <>
      <SEO
        title="Terms of Service - Any Social Downloader | User Agreement & Guidelines"
        description="Read our complete Terms of Service to understand the rules, guidelines, and legal agreement for using Any Social Downloader. Learn about acceptable use, user responsibilities, restrictions, copyright policies, and service limitations for downloading videos from social media platforms."
        keywords="terms of service, user agreement, terms and conditions, legal, guidelines, acceptable use policy, user responsibilities, copyright policy, DMCA, service terms, user guidelines, legal agreement, terms of use, platform rules, download restrictions, prohibited use, liability disclaimer, intellectual property, social media terms, video downloader terms, service agreement, legal disclaimer, user obligations, fair use policy, content usage rights"
        url="/terms"
      />

      <Header />

      <motion.div
        className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-red-50"
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
                className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-red-600 rounded-3xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FaFileContract className="text-white text-4xl" />
              </motion.div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              Terms of{" "}
              <span className="text-gradient bg-gradient-to-r from-purple-500 to-red-600 bg-clip-text text-transparent">
                Service
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4">
              These terms govern your use of Any Social Downloader. Please read
              them carefully before using our service.
            </p>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>Effective date:</span>
              <span className="font-semibold">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </motion.div>

          {/* Terms Highlights */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
            variants={itemVariants}
          >
            {termsHighlights.map((item, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-red-600 rounded-xl mx-auto mb-4">
                  <item.icon className="text-white text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Terms Content */}
          <motion.div
            className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-lg p-8 md:p-12 space-y-8"
            variants={itemVariants}
          >
            {/* Acceptance of Terms */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaHandshake className="text-green-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Acceptance of Terms
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  By accessing and using Any Social Downloader ("the Service"),
                  you agree to be bound by these Terms of Service and all
                  applicable laws and regulations. If you do not agree with any
                  of these terms, you are prohibited from using the Service.
                </p>
              </div>
            </section>

            {/* Service Description */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaCheckCircle className="text-blue-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Service Description
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Any Social Downloader is a web-based service that allows users
                  to download videos and audio content from various social media
                  platforms including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>YouTube</li>
                  <li>Facebook</li>
                  <li>Instagram</li>
                  <li>TikTok</li>
                  <li>Twitter</li>
                </ul>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaUserCheck className="text-purple-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Acceptable Use
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  <strong>You may use our service to:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Download content that you own or have permission to download
                  </li>
                  <li>Download content for personal, non-commercial use</li>
                  <li>Download content that is in the public domain</li>
                  <li>
                    Download content under fair use provisions (where
                    applicable)
                  </li>
                </ul>
              </div>
            </section>

            {/* Prohibited Activities */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaBan className="text-red-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Prohibited Activities
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  <strong>You may NOT use our service to:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Download copyrighted content without permission</li>
                  <li>Violate any intellectual property rights</li>
                  <li>Download content for commercial redistribution</li>
                  <li>Abuse or overload our servers with excessive requests</li>
                  <li>Attempt to hack, compromise, or disrupt the service</li>
                  <li>Download illegal or inappropriate content</li>
                  <li>Circumvent any access restrictions or rate limits</li>
                </ul>
              </div>
            </section>

            {/* Copyright and DMCA */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaShieldAlt className="text-orange-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Copyright and DMCA
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  We respect intellectual property rights and expect our users
                  to do the same. Any Social Downloader does not host, store, or
                  distribute copyrighted content.
                </p>
                <p>
                  <strong>DMCA Compliance:</strong> If you believe that your
                  copyrighted work has been infringed through the use of our
                  service, please contact us immediately with proper DMCA
                  notification.
                </p>
                <p>
                  <strong>User Responsibility:</strong> Users are solely
                  responsible for ensuring they have the right to download any
                  content they request through our service.
                </p>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaExclamationCircle className="text-yellow-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Disclaimers
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  <strong>Service Availability:</strong> We strive to maintain
                  high service availability but cannot guarantee 100% uptime.
                  The service may be temporarily unavailable for maintenance,
                  updates, or due to factors beyond our control.
                </p>
                <p>
                  <strong>Third-Party Platforms:</strong> Our service depends on
                  third-party platforms. Changes to these platforms may affect
                  our service functionality.
                </p>
                <p>
                  <strong>Content Quality:</strong> While we aim to provide the
                  best quality downloads, the final quality depends on the
                  source content and platform limitations.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaGavel className="text-gray-600 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Limitation of Liability
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  In no event shall Any Social Downloader be liable for any
                  indirect, incidental, special, consequential, or punitive
                  damages, including without limitation, loss of profits, data,
                  use, goodwill, or other intangible losses.
                </p>
                <p>
                  <strong>Maximum Liability:</strong> Our total liability to you
                  for all damages shall not exceed the amount you paid us in the
                  last 12 months (which is $0 for our free service).
                </p>
              </div>
            </section>

            {/* Modifications */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaFileContract className="text-indigo-500 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Modifications to Terms
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  We reserve the right to modify these Terms of Service at any
                  time. Changes will be effective immediately upon posting. Your
                  continued use of the service after changes constitutes
                  acceptance of the new terms.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaBan className="text-red-600 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Termination
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  We may terminate or suspend your access to the service
                  immediately, without prior notice or liability, for any reason
                  whatsoever, including without limitation if you breach the
                  Terms.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FaGavel className="text-blue-600 text-xl" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Governing Law
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  These Terms shall be interpreted and governed by the laws of
                  the jurisdiction in which Any Social Downloader operates,
                  without regard to its conflict of law provisions.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-r from-purple-500 to-red-600 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-4">
                Questions About These Terms?
              </h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please
                don't hesitate to contact us.
              </p>
              <motion.a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHandshake className="mr-2" />
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

export default memo(TermsOfService);
