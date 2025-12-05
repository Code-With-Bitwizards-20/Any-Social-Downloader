import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaDownload } from "react-icons/fa";
import MainLogo from "../../assets/Main-Logo.png";

const MobileAppPromo = ({ inline = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={
          inline
            ? "relative max-w-[280px] sm:max-w-xs w-full"
            : "fixed bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 z-40 max-w-[280px] sm:max-w-xs"
        }
        initial={{ opacity: 0, scale: 0.8, ...(inline ? {} : { y: 100 }) }}
        animate={{ opacity: 1, scale: 1, ...(inline ? {} : { y: 0 }) }}
        exit={{ opacity: 0, scale: 0.8, ...(inline ? {} : { y: 100 }) }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className={`relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden ${
            isExpanded ? "p-4 sm:p-5 md:p-6" : "p-3 sm:p-4"
          }`}
          layout
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl"></div>

          {/* Close Button */}
          <motion.button
            onClick={handleClose}
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Close Mobile App Promo"
          >
            <FaTimes className="text-white text-[10px] sm:text-xs" />
          </motion.button>

          <div className="relative z-10">
            {/* Collapsed State */}
            <AnimatePresence mode="wait">
              {!isExpanded ? (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="cursor-pointer"
                  onClick={toggleExpanded}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <motion.div
                      className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-lg sm:rounded-xl p-1"
                      whileHover={{ scale: 1.1 }}
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                    >
                      <img
                        src={MainLogo}
                        alt="App Logo"
                        className="w-full h-full object-contain"
                      />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-xs sm:text-sm">
                        Our Mobile App
                      </p>
                      <p className="text-white/80 text-[11px] sm:text-xs">
                        Tap to learn more
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Expanded State
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <motion.div
                      className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/90 rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 p-1.5"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    >
                      <img
                        src={MainLogo}
                        alt="App Logo"
                        className="w-full h-full object-contain"
                      />
                    </motion.div>

                    <h3 className="text-white font-bold text-base sm:text-lg mb-2">
                      Download Our App
                    </h3>

                    <p className="text-white/90 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                      Get the mobile app for faster downloads and better
                      experience on your phone!
                    </p>

                    <div className="space-y-2 sm:space-y-3">
                      <motion.a
                        href="#" // You can add your Play Store link here
                        className="flex items-center justify-center w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl text-white font-semibold text-xs sm:text-sm transition-all duration-300"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaDownload className="mr-1.5 sm:mr-2 text-xs sm:text-sm" />
                        Download APK
                      </motion.a>

                      <button
                        onClick={toggleExpanded}
                        className="text-white/70 hover:text-white text-[10px] sm:text-xs underline transition-colors duration-200"
                        aria-label="Collapse Mobile App Promo"
                      >
                        Maybe later
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Animated border */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl opacity-30 animate-pulse"></div>
          </div>
        </motion.div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-10, -30, -10],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileAppPromo;
