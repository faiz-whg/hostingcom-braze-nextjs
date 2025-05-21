import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Or your chosen font import
import "./globals.css";
import { AuthProvider } from '@/lib/contexts/AuthContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * @constant metadata
 * @description Metadata for the application, including title and description.
 * This is used by Next.js to set the `<title>` and `<meta name="description">` tags in the HTML head.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Hosting Portal",
  description: "Customer portal for Hosting services",
  icons: {
    icon: "/images/hosting-favicon.png",
    apple: "/images/hosting-favicon.png",
  },
};

/**
 * @component RootLayout
 * @description The root layout component for the Next.js application.
 * It sets up the basic HTML document structure (`<html>`, `<body>`),
 * applies global fonts and styles, and wraps the application content (`children`)
 * with the `AuthProvider` to provide authentication context throughout the app.
 * @param {object} props - The props for the component.
 * @param {React.ReactNode} props.children - The child components to be rendered within this layout.
 * @returns {JSX.Element} The root HTML structure of the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
