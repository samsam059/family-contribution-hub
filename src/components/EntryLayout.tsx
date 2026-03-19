import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EntrySidebar } from "@/components/EntrySidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function EntryLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-svh flex w-full">
        <EntrySidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 shadow-sm">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 p-6 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
