import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const font = Nunito({ subsets: ['latin'] })


export const metadata: Metadata = {
  title: "Game Hub",
  description: "Ultimate Board Game Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${font.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
