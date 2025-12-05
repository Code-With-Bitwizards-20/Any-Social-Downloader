import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaYoutube, 
  FaFacebook, 
  FaInstagram, 
  FaTiktok, 
  FaTwitter,
  FaDownload,
  FaVideo,
  FaMusic
} from 'react-icons/fa';
import SEO from '../components/common/SEO';
import MobileAppPromo from '../components/common/MobileAppPromo';
import { memo } from 'react';

const Landing = () => {
  const navigate = useNavigate();

  const platforms = [
    {
      name: 'YouTube',
      icon: FaYoutube,
      color: 'bg-youtube-red hover:bg-red-600',
      textColor: 'text-white',
      description: 'Download videos and audio from YouTube',
      route: '/youtube'
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'bg-facebook-blue hover:bg-blue-600',
      textColor: 'text-white',
      description: 'Download Facebook videos and posts',
      route: '/facebook'
    },
    {
      name: 'Instagram',
      icon: FaInstagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      textColor: 'text-white',
      description: 'Download Instagram photos and videos',
      route: '/instagram'
    },
    {
      name: 'TikTok',
      icon: FaTiktok,
      color: 'bg-tiktok-black hover:bg-gray-800',
      textColor: 'text-white',
      description: 'Download TikTok videos without watermark',
      route: '/tiktok'
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: 'bg-twitter-blue hover:bg-blue-500',
      textColor: 'text-white',
      description: 'Download Twitter videos and GIFs',
      route: '/twitter'
    }
  ];

  const features = [
    {
      icon: FaVideo,
      title: 'High Quality Video',
      description: 'Download videos in HD, Full HD, and 4K quality'
    },
    {
      icon: FaMusic,
      title: 'Audio Extraction',
      description: 'Extract MP3 audio from any video with high quality'
    },
    {
      icon: FaDownload,
      title: 'Fast Downloads',
      description: 'Lightning-fast downloads with no file size limits'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 }
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  const handlePlatformClick = (route) => {
    navigate(route);
  };

  return (
    <>
      <SEO />
      
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      {/* Hero Section */}
      <motion.section 
        className="relative px-4 py-12 sm:px-6 lg:px-8"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold">
                <span className="text-gray-900">Any Social</span>
                <br />
                <span className="text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Downloader
                </span>
              </h1>
            </motion.div>
            
            <motion.p
              className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl md:text-2xl text-gray-600 leading-relaxed"
              variants={itemVariants}
            >
              Download videos and audio from your favorite social media platforms. 
              Fast, free, and without any limitations.
            </motion.p>
            
            <motion.div
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={itemVariants}
            >
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                aria-label="Start Downloading Now"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/youtube')}
              >
                Start Downloading Now
              </motion.button>
              
              <motion.button
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                aria-label="Learn More"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/about')}
              >
                Learn More
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            variants={itemVariants}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Downloader?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the best video downloading service with these amazing features
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl mb-4">
                  <feature.icon className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Platforms Section */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            variants={itemVariants}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Supported Platforms
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose your platform and start downloading content instantly
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {platforms.map((platform, index) => (
              <motion.div
                key={index}
                className={`${platform.color} ${platform.textColor} rounded-2xl p-6 cursor-pointer shadow-lg card-hover group relative overflow-hidden`}
                variants={cardVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlatformClick(platform.route)}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 transform rotate-12 translate-x-6 -translate-y-6 opacity-10">
                  <platform.icon className="w-full h-full" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-12 h-12 mb-4 bg-white bg-opacity-20 rounded-xl">
                    <platform.icon className="text-2xl" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:scale-105 transition-transform duration-200">
                    {platform.name}
                  </h3>
                  
                  <p className="text-sm opacity-90 leading-relaxed">
                    {platform.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-sm font-medium opacity-80">
                    <span>Download Now</span>
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600"
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold text-white mb-6"
            variants={itemVariants}
          >
            Ready to Start Downloading?
          </motion.h2>
          
          <motion.p 
            className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Join millions of users who trust our platform for their video downloading needs. 
            It's completely free and always will be.
          </motion.p>
          
          <motion.button
            className="px-10 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1"
            aria-label="Get Started Free"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/youtube')}
          >
            Get Started Free
          </motion.button>
        </div>
      </motion.section>
      </motion.div>

      <div className="hidden sm:block">
        <MobileAppPromo />
      </div>
    </>
  );
};

export default memo(Landing);
