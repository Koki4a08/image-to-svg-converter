import type { Metadata } from "next";
import { Madimi_One, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const madimiOne = Madimi_One({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-madimi-one',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Image to SVG Converter",
  description: "Convert your images to SVG format easily",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${madimiOne.variable} antialiased`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem={true}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
