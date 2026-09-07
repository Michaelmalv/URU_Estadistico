import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "PORTAL DE EVALUACIÓN DE PROYECTOS ESTRATÉGICOS",
  description: "Dirección de Desarrollo Urbanístico - Evaluación de seguridad, economía y suelo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
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
