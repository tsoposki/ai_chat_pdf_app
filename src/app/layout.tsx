import "./globals.css";

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "react-toastify";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={poppins.className}>
          <div className="bg-[#faf9f6]">
            {children}
          </div>
          <ToastContainer />
        </body>
      </html>
    </ClerkProvider>
  );
}

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  style: "normal",
});

export const metadata: Metadata = {
  title: "PDF Wisdom",
  description: "Chat with Document",
};
