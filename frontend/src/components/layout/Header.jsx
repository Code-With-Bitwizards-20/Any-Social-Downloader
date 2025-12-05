import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBars,
  FaTimes,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitter,
} from "react-icons/fa";
import MainLogo from "../../assets/Main-Logo.png";
import { memo } from "react";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    {
      name: "YouTube",
      href: "/youtube",
      icon: FaYoutube,
      color: "text-red-600",
    },
    {
      name: "Facebook",
      href: "/facebook",
      icon: FaFacebook,
      color: "text-blue-600",
    },
    {
      name: "Instagram",
      href: "/instagram",
      icon: FaInstagram,
      color: "text-pink-600",
    },
    { name: "TikTok", href: "/tiktok", icon: FaTiktok, color: "text-gray-900" },
    {
      name: "Twitter",
      href: "/twitter",
      icon: FaTwitter,
      color: "text-blue-400",
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActivePage = (href) => {
    return location.pathname === href;
  };

  return (
    <>
      <motion.header
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-0 group">
              <motion.div
                className="flex items-center justify-center transition-all duration-300"
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={MainLogo}
                  alt="Any Social Downloader logo"
                  className="h-16 w-auto md:h-16 lg:h-20"
                  aria-hidden="true"
                  width={16}
                  height={16}
                  loading="lazy"
                />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  Any Social
                </span>
                <span className="text-sm md:text-base font-semibold text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Downloader
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:bg-gray-100 ${
                    isActivePage(item.href)
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`text-lg ${
                      isActivePage(item.href) ? "text-blue-600" : item.color
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <motion.button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              onClick={toggleMobileMenu}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle Mobile Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaTimes className="text-gray-700 text-lg" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaBars className="text-gray-700 text-lg" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
            />

            {/* Mobile Menu */}
            <motion.div
              className="fixed top-0 right-0 z-50 w-80 max-w-[85vw] h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 shadow-2xl lg:hidden"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-6 border-b border-blue-200/50 bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center space-x-0">
                    <div className="flex items-center justify-center">
                      <img
                        src={MainLogo}
                        alt="Any Social Downloader logo"
                        className="h-14 w-auto sm:h-16"
                        aria-hidden="true"
                        width={16}
                        height={16}
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        Any Social
                      </div>
                      <div className="text-sm font-semibold text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Downloader
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    aria-label="Close Mobile Menu"
                  >
                    <FaTimes className="text-gray-700 text-lg" />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 px-6 py-6">
                  <div className="space-y-2">
                    {navigation.map((item) => (
                      <motion.div key={item.name}>
                        <Link
                          to={item.href}
                          onClick={closeMobileMenu}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                            isActivePage(item.href)
                              ? "bg-white/80 text-blue-600 shadow-sm border border-blue-200/50"
                              : "text-gray-700 hover:bg-white/60 hover:shadow-sm"
                          }`}
                        >
                          <item.icon
                            className={`text-lg ${
                              isActivePage(item.href)
                                ? "text-blue-600"
                                : item.color
                            }`}
                          />
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </nav>

                {/* Mobile Menu Footer */}
                <div className="p-6 border-t border-blue-200/50 bg-white/70 backdrop-blur-sm">
                  <p className="text-center text-sm text-gray-600">
                    Made with ❤️ by{" "}
                    <span className="font-semibold text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Code With Bitwizards
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Header);
