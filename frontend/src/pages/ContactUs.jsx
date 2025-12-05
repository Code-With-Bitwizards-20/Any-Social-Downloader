import { useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import {
  FaEnvelope,
  FaYoutube,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane,
  FaUser,
  FaTag,
  FaCommentAlt,
  FaWhatsapp,
  FaLinkedin,
  FaGithub,
} from "react-icons/fa";
import SEO from "../components/common/SEO";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileAppPromo from "../components/common/MobileAppPromo";
import { memo } from "react";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  // EmailJS config
  const EMAILJS_SERVICE_ID =
    import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_7lhsp9c";
  const EMAILJS_TEMPLATE_ID_OWNER =
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID_OWNER || "template_ntpcr5k";
  const EMAILJS_PUBLIC_KEY =
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY ||
    import.meta.env.VITE_EMAILJS_PRIVATE_KEY ||
    "uignpGFBs5XFStG1p";
  const SITE_URL =
    import.meta.env.VITE_SITE_URL || "https://www.anysocialdownloader.com";

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

  const contactInfo = [
    {
      icon: FaEnvelope,
      title: "Email Us",
      description: "Send us an email anytime",
      contact: "Any Quarries",
      link: "mailto:mediatechgseries@gmail.com",
    },
    {
      icon: FaWhatsapp,
      title: "WhatsApp",
      description: "Message us on WhatsApp",
      contact: "Chat with us",
      link: "https://wa.me/message/CKZZ336X5UN3K1",
    },
    {
      icon: FaClock,
      title: "Response Time",
      description: "We typically respond within",
      contact: "24 hours",
      link: "https://wa.me/message/CKZZ336X5UN3K1",
    },
    {
      icon: FaMapMarkerAlt,
      title: "Global Service",
      description: "Available worldwide",
      contact: "24/7 Support",
      link: "https://wa.me/message/CKZZ336X5UN3K1",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate env config
    if (
      !EMAILJS_SERVICE_ID ||
      !EMAILJS_TEMPLATE_ID_OWNER ||
      !EMAILJS_PUBLIC_KEY ||
      EMAILJS_SERVICE_ID.startsWith("YOUR_") ||
      EMAILJS_TEMPLATE_ID_OWNER.startsWith("YOUR_") ||
      EMAILJS_PUBLIC_KEY.startsWith("YOUR_")
    ) {
      console.error(
        "Missing EmailJS environment variables. Please set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID_OWNER, and VITE_EMAILJS_PUBLIC_KEY (or VITE_EMAILJS_PRIVATE_KEY) in your .env file."
      );
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("");

    const { name, email, subject, message } = formData;
    const origin = SITE_URL;

    try {
      // Send email to site owner/support inbox
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_OWNER,
        {
          from_name: name,
          from_email: email,
          to_email: email,
          email,
          subject,
          message,
          reply_to: email,
          site_url: origin,
        },
        EMAILJS_PUBLIC_KEY
      );

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });

      // Clear success message after 8 seconds
      setTimeout(() => setSubmitStatus(""), 8000);
    } catch (err) {
      const details = {
        status: err?.status,
        text: err?.text,
        message: err?.message,
      };
      console.error("EmailJS error:", details, err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Contact Us - Any Social Downloader | Support, Help & Feedback"
        description="Get in touch with the Any Social Downloader team for support, help, and feedback. We're here to assist you with video downloading issues, technical support, feature requests, and general inquiries. Contact us via email, WhatsApp, or our support channels for quick assistance."
        keywords="contact us, support, help, feedback, customer service, get in touch, technical support, customer care, help desk, contact support, video downloader support, social media downloader help, troubleshooting, feature requests, bug reports, user feedback, customer assistance, online support, download issues, contact team, service help, problem resolution, query support, assistance center, user support, contact details, support channels"
        url="/contact"
      />

      <Header />

      <motion.div
        className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50"
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
                className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-600 rounded-3xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FaEnvelope className="text-white text-4xl" />
              </motion.div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              Contact{" "}
              <span className="text-gradient bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
                Us
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Have a question, suggestion, or need help? We'd love to hear from
              you! Get in touch with our friendly team.
            </p>
          </motion.div>

          {/* Contact Info Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
            variants={itemVariants}
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl mx-auto mb-4">
                  <info.icon className="text-white text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {info.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{info.description}</p>
                {info.link ? (
                  <motion.a
                    href={info.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 font-medium hover:text-orange-700 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                  >
                    {info.contact}
                  </motion.a>
                ) : (
                  <span className="text-orange-600 font-medium">
                    {info.contact}
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Contact Form and Social Links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <motion.div className="lg:col-span-2" variants={itemVariants}>
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-lg p-8 md:p-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Send us a Message
                </h2>
                <p className="text-gray-600 mb-8">
                  Fill out the form below and we'll get back to you as soon as
                  possible.
                </p>

                {submitStatus === "success" && (
                  <motion.div
                    className="mb-6 p-4 bg-green-100 border border-green-300 rounded-xl text-green-700"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center space-x-2">
                      <FaPaperPlane className="text-green-600" />
                      <span className="font-semibold">
                        Message sent successfully!
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      We'll get back to you within 24 hours.
                    </p>
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div
                    className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl text-red-700"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center space-x-2">
                      <FaPaperPlane className="text-red-600" />
                      <span className="font-semibold">
                        Failed to send message.
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      There was a problem sending your message. Please try again
                      later or contact us directly at
                      mediatechgseries@gmail.com.
                    </p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        <FaUser className="inline mr-2 text-orange-500" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/50"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        <FaEnvelope className="inline mr-2 text-orange-500" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/50"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <FaTag className="inline mr-2 text-orange-500" />
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/50"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <FaCommentAlt className="inline mr-2 text-orange-500" />
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/50 resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    aria-label="Send Message"
                    className={`w-full flex items-center justify-center px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:shadow-xl"
                    }`}
                    whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-3" />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>

            {/* Social Links and Additional Info */}
            <motion.div className="space-y-8" variants={itemVariants}>
              {/* Quick Contact */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Quick Contact
                </h3>
                <div className="space-y-4">
                  <motion.a
                    href="https://wa.me/message/CKZZ336X5UN3K1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-green-100 hover:bg-green-200 rounded-xl transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <FaWhatsapp className="text-green-600 text-xl mr-3" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        WhatsApp
                      </div>
                      <div className="text-sm text-gray-600">
                        Chat with us instantly
                      </div>
                    </div>
                  </motion.a>

                  <motion.a
                    href="mailto:mediatechgseries@gmail.com"
                    className="flex items-center p-3 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <FaEnvelope className="text-blue-600 text-xl mr-3" />
                    <div>
                      <div className="font-semibold text-gray-900">Email</div>
                      <div className="text-sm text-gray-600">
                        Send us an email
                      </div>
                    </div>
                  </motion.a>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Follow Us
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Stay updated with our latest features and announcements.
                </p>
                <div className="flex space-x-3">
                  <motion.a
                    href="https://github.com/Code-With-Bitwizards-20"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaGithub className="text-xl" />
                  </motion.a>
                  <motion.a
                    href="www.linkedin.com/in/codewithbitwizards1000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaLinkedin className="text-xl" />
                  </motion.a>
                  <motion.a
                    href="www.youtube.com/@CodeWithBitwizards"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaYoutube className="text-xl" />
                  </motion.a>
                </div>
              </div>

              {/* FAQ Prompt */}
              <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Need Quick Help?</h3>
                <p className="text-sm opacity-90 mb-4">
                  Before contacting us, check if your question is answered in
                  our documentation or try refreshing the page if you're
                  experiencing issues.
                </p>
                <div className="text-xs opacity-80">
                  💡 Most download issues are resolved by trying a different
                  video quality or browser.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <Footer />

      <div className="hidden sm:block">
        <MobileAppPromo />
      </div>
    </>
  );
};

export default memo(ContactUs);
