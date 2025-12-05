import { Helmet } from "react-helmet-async";
import { useMemo } from "react";

const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  noindex = false,
  canonical,
}) => {
  const defaultTitle =
    "Any Social Downloader - Download Videos & Audio from YouTube, Facebook, Instagram, TikTok & Twitter";
  const defaultDescription =
    "Download videos and audio from YouTube, Facebook, Instagram, TikTok, and Twitter for free. Fast, secure, and no file size limits. Support HD, Full HD, and 4K quality downloads.";
  const defaultKeywords =
    "video downloader, YouTube downloader, Facebook video download, Instagram video downloader, TikTok downloader, Twitter video download, MP3 converter, HD video download, free video downloader Code With Bitwizards";
  const defaultImage = "/og-image.png"; // Make sure this image exists in your `public` folder

  const siteUrl = "https://anysocialdownloader.com";

  const seoTitle = title ? `${title} | Any Social Downloader` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || defaultKeywords;
  const seoImage = image ? `${siteUrl}${image}` : `${siteUrl}${defaultImage}`;
  const seoUrl = url ? `${siteUrl}${url}` : siteUrl;
  const canonicalUrl = canonical || seoUrl;

  const structuredData = useMemo(
    () =>
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Any Social Downloader",
        description: seoDescription,
        url: siteUrl,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web Browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        creator: {
          "@type": "Organization",
          name: "Code With Bitwizards",
        },
      }),
    [seoDescription, siteUrl]
  );

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="title" content={seoTitle} />
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="author" content="Code With Bitwizards" />
      <meta
        name="robots"
        content={noindex ? "noindex,nofollow" : "index,follow"}
      />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:site_name" content="Any Social Downloader" />
      <meta property="og:locale" content="en_US" /> 

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={seoUrl} />
      <meta property="twitter:title" content={seoTitle} />
      <meta property="twitter:description" content={seoDescription} />
      <meta property="twitter:image" content={seoImage} />
      <meta property="twitter:creator" content="@codewithbitwizards" />

      {/* Additional Meta Tags */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, viewport-fit=cover"
      />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Any Social Downloader" />

      {/* Structured Data */}
      <script type="application/ld+json">{structuredData}</script>
    </Helmet>
  );
};

export default SEO;
