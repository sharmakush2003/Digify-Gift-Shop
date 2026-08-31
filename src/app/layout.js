import "./globals.css";
import Script from "next/script";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import LoginModal from "./components/LoginModal";
import PromoOfferModal from "./components/PromoOfferModal";
import FloatingCart from "./components/FloatingCart";

export const metadata = {
  title: "Orient Crockeries | Premium Hospitality & Dining Solutions",
  description:
    "Discover the world's best collection of premium and customized crockery at Orient Crockeries. Perfect for homes, hotels, and restaurants.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          precedence="default"
        />
      </head>
      <body className="preload">
        <AuthProvider>
          <AppProvider>
            <Navbar />
            <LoginModal />
            <PromoOfferModal />
            {children}
            <Footer />
            <FloatingCart />
          </AppProvider>
        </AuthProvider>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}

