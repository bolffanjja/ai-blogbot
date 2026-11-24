import type { Metadata } from "next";
import AppSidebar from "@/components/AppSidebar";
import MobileNavigation from "@/components/MobileNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI BlogBot",
  description: "Generiši blogove pomoću veštačke inteligencije",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr">
      <body>
        {/* Zajednički okvir za sve stranice: meni levo (računar) ili gore (telefon), sadržaj desno */}
        <div className="min-h-screen lg:flex">
          <AppSidebar />
          <div className="min-w-0 flex-1">
            <MobileNavigation />
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
