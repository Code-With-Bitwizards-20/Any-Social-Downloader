import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaHeart,
} from "react-icons/fa";
import MobileAppPromo from "../common/MobileAppPromo";
import MainLogo from "../../assets/Main-Logo.png";
import { memo } from "react";

const Footer = () => {
  const platformLinks = [
    { name: "YouTube", href: "/youtube", icon: FaYoutube },
    { name: "Facebook", href: "/facebook", icon: FaFacebook },
    { name: "Instagram", href: "/instagram", icon: FaInstagram },
    { name: "TikTok", href: "/tiktok", icon: FaTiktok },
    { name: "Twitter", href: "/twitter", icon: FaTwitter },
  ];

  const companyLinks = [
    { name: "About Us", href: "/about" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Contact Us", href: "/contact" },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
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

  return (
    <motion.footer
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Section */}
            <motion.div
              className="text-center sm:text-left lg:col-span-2"
              variants={itemVariants}
            >
              <Link
                to="/"
                className="flex items-center justify-center sm:justify-start space-x-0 group mb-6"
              >
                <motion.div
                  className="flex items-center justify-center transition-all duration-300"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                >
                  <img
                    src={MainLogo}
                    alt="Any Social Downloader logo"
                    className="h-[5.5rem] w-auto sm:h-20"
                    aria-hidden="true"
                    width={16}
                    height={16}
                    loading="lazy"
                  />
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                    Any Social
                  </span>
                  <span className="text-lg font-semibold text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Downloader
                  </span>
                </div>
              </Link>
              <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-md mx-auto sm:mx-0">
                Download videos and audio from your favorite social media
                platforms. Fast, free, and secure downloads with no limitations.
              </p>
              <div className="flex items-center justify-center sm:justify-start space-x-4">
                <motion.a
                  href="https://github.com/Code-With-Bitwizards-20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Visit our GitHub profile"
                >
                  <FaGithub className="text-white text-lg" />
                </motion.a>
                <motion.a
                  href="www.linkedin.com/in/codewithbitwizards1000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Visit our LinkedIn profile"
                >
                  <FaLinkedin className="text-white text-lg" />
                </motion.a>
                <motion.a
                  href="mailto:mediatechgseries@gmail.com"
                  className="flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-500 rounded-xl transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Send us an email"
                >
                  <FaEnvelope className="text-white text-lg" />
                </motion.a>
              </div>
            </motion.div>

            {/* Platforms Section */}
            <motion.div
              className="text-center sm:text-left"
              variants={itemVariants}
            >
              <h3 className="text-xl font-bold text-white mb-6">Platforms</h3>
              <ul className="space-y-4">
                {platformLinks.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="flex items-center justify-center sm:justify-start space-x-3 text-gray-300 hover:text-white transition-colors duration-300 group"
                    >
                      <item.icon className="text-lg group-hover:scale-110 transition-transform duration-300" />
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company Section with Mobile App Promo */}
            <motion.div
              className="text-center sm:text-left"
              variants={itemVariants}
            >
              <div className="flex flex-col items-center sm:items-start sm:flex-row sm:justify-between gap-6">
                {/* Company Links */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Company</h3>
                  <ul className="space-y-4">
                    {companyLinks.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className="text-gray-300 hover:text-white transition-colors duration-300 group block"
                        >
                          <span className="group-hover:translate-x-1 inline-block transition-transform duration-300">
                            {item.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mobile App Promo - Only visible on small screens */}
                <div className="sm:hidden lg:hidden flex justify-center w-full">
                  <div className="relative">
                    <MobileAppPromo inline={true} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Footer */}
        <motion.div
          className="py-8 border-t border-gray-700"
          variants={itemVariants}
        >
          <div className="text-center space-y-2">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Any Social Downloader. All
              rights reserved.
            </p>

            <motion.p
              className="text-gray-400 text-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              Designed and coded with{" "}
              <motion.span
                className="inline-block mx-1"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <FaHeart className="text-red-600 inline" />
              </motion.span>{" "}
              by{" "}
              <motion.a
                href="https://wa.me/message/CKZZ336X5UN3K1"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-300 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              >
                Code With Bitwizards
              </motion.a>
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-blue-600/10 rounded-full blur-3xl"></div>
      </div>
    </motion.footer>
  );
};

export default memo(Footer);
