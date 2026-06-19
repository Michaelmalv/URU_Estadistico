import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata = {
  title: "PORTAL DE EVALUACIÓN DE PROYECTOS ESTRATÉGICOS",
  description: "Dirección de Desarrollo Urbanístico - Evaluación de seguridad, economía y suelo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <header className="portal-header">
          <div 
            className="portal-header-banner" 
            style={{ backgroundImage: "url('/header.jpeg')" }}
          >
            <div className="portal-header-content">
              <h1 className="portal-title">
                Portal de Evaluación de Proyectos Estratégicos
              </h1>
              <p className="portal-subtitle">
                Dirección de Desarrollo Urbanístico
              </p>
            </div>
          </div>
        </header>
        <Navbar />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
