import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a192f" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://jerilkuriakose.github.io"),
  title: "Jeril Kuriakose | Principal Data Scientist",
  description:
    "Principal Data Scientist with deep expertise in LLMs, NLP, and agentic AI systems. Leading end-to-end development of high-impact AI platforms including Arabic LLMs (ALLaM).",
  keywords: [
    "Data Scientist",
    "Machine Learning",
    "LLM",
    "NLP",
    "Artificial Intelligence",
    "Gen AI",
    "Arabic LLM",
    "ALLaM",
    "MLOps",
    "Deep Learning",
  ],
  authors: [{ name: "Jeril Kuriakose" }],
  creator: "Jeril Kuriakose",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jerilkuriakose.github.io",
    siteName: "Jeril Kuriakose Portfolio",
    title: "Jeril Kuriakose | Principal Data Scientist",
    description:
      "Principal Data Scientist with deep expertise in LLMs, NLP, and agentic AI systems.",
    images: [
      {
        url: "/profile.jpg",
        width: 800,
        height: 800,
        alt: "Jeril Kuriakose",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jeril Kuriakose | Principal Data Scientist",
    description:
      "Principal Data Scientist with deep expertise in LLMs, NLP, and agentic AI systems.",
    images: ["/profile.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
