# Any Social Downloader - Frontend

This is the frontend application for Any Social Downloader, built with React, Vite, and Tailwind CSS.

## 🛠 Tech Stack

- **React 18** - UI library with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **React Icons** - Icon components

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Header, Footer, Layout)
│   ├── ui/              # Reusable UI components (Button, Input, Modal)
│   └── common/          # Common components used across pages
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions and helpers
├── styles/              # CSS and styling files
└── assets/              # Static assets (images, icons)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Build
```bash
npm run build
```
Builds the app for production to the `dist` folder.

### Preview
```bash
npm run preview
```
Preview the production build locally.

### Lint
```bash
npm run lint
```
Runs ESLint to check for code quality issues.

## 🎨 Styling

This project uses Tailwind CSS for styling with custom configurations:

### Custom Colors
- `youtube-red`: #FF0000
- `facebook-blue`: #1877F2
- `instagram-gradient`: #E4405F
- `tiktok-black`: #000000
- `twitter-blue`: #1DA1F2

### Custom Animations
- `fade-in`: Fade in animation
- `slide-up`: Slide up animation
- `scale-in`: Scale in animation

## 📱 Responsive Design

The application is fully responsive and supports:
- Mobile: 315px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1920px+

## 🔧 Configuration Files

- `vite.config.js` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `package.json` - Dependencies and scripts

## 🌟 Features

- **Landing Page**: Modern hero section with platform cards
- **Responsive Design**: Works on all device sizes
- **Smooth Animations**: Powered by Framer Motion
- **Modern UI**: Clean and intuitive interface
- **Fast Loading**: Optimized with Vite

## 📄 License

This project is part of the Any Social Downloader application and follows the same license terms.
