import { Outlet } from "react-router-dom";
import { ProductRail } from "./ProductRail";
import { ProductSidebar } from "./ProductSidebar";
import { useProductContext } from "@/contexts/ProductContext";

export function AppShell() {
  const { currentProductId } = useProductContext();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Column 1: Product Switcher Rail */}
      <ProductRail />

      {/* Column 2: Product Navigation Sidebar (only when product selected) */}
      {currentProductId && <ProductSidebar />}

      {/* Column 3: Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}
