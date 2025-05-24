import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/navbar/Navbar";
import Footer from "@/components/shared/footer/Footer";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Orvix 360 Internal Portal",
  description: "Orvix 360 Internal Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* <Navbar /> */}
          <main className="flex-grow">{children}</main>
          {/* <Footer /> */}
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
