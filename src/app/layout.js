import "./globals.css";
import Script from "next/script";
import WhatsAppFloating from "./components/WhatsAppFloating";

export const metadata = {
  title: "Digisoft Gift Shop | Premium Gifts for Every Occasion",
  description:
    "Discover the world's best collection of premium and customized gifts at Digisoft Gift Shop. Perfect for birthdays, anniversaries, and corporate events.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          precedence="default"
        />
      </head>
      <body className="preload">
        {children}
        <WhatsAppFloating />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
