import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AIChatbot } from "@/components/features/AIChatbot";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
      <AIChatbot />
    </div>
  );
}
