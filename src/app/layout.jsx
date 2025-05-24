import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/navbar/Navbar";
import Footer from "@/components/shared/footer/Footer";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Orvix 360 Internal Portal",
  description: "Orvix 360 Internal Portal",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon-modern.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    other: [
      { url: "/favicon/favicon-192x192.png", sizes: "192x192", type: "image/png", rel: "apple-touch-icon" },
      { url: "/favicon/favicon-256x256.png", sizes: "256x256", type: "image/png", rel: "icon" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {/* <Navbar /> */}
            <main className="flex-grow">{children}</main>
            {/* <Footer /> */}
          </div>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
