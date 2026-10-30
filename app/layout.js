import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Optex - Read Anything.",
  description: "Advanced OCR and text digitization using AI.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  verification: {
    google: "Q4TDzE3G5_scwK2g96A50ooFKe2T1soFPCZP77_2Ja0",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${merriweather.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
