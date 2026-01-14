import { Outlet } from "react-router-dom";
import { ProductRail } from "./ProductRail";
import { ProductSidebar } from "./ProductSidebar";
import { useProductContext } from "@/contexts/ProductContext";
import { isMockMode } from "@/lib/ipc";

export function AppShell() {
  const { currentProductId } = useProductContext();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Mock Mode Banner */}
      {isMockMode && (
        <div className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Preview Mode — Using sample data (changes won't persist)
          </span>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Product Switcher Rail */}
        <ProductRail />

        {/* Column 2: Product Navigation Sidebar (only when product selected) */}
        {currentProductId && <ProductSidebar />}

        {/* Column 3: Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
