import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PCB Copilot",
  description: "MVP frontend for PCB Copilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <header className="topbar">
          <Link className="brand" href="/">
            PCB Copilot
          </Link>
          <nav className="nav">
            <Link href="/new-project">Создать проект</Link>
            <Link href="/result">Результат</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
