import { NavLink } from "react-router-dom";
import {
  Zap,
  Home,
  AlertCircle,
  Lightbulb,
  FlaskConical,
  CheckCircle,
  Paperclip,
  Clock,
  Download,
  Settings,
  Tags,
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuickCaptureButton } from "@/components/quick-capture/QuickCaptureButton";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all duration-100",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function ProductSidebar() {
  const { currentProductId, currentProduct } = useProductContext();

  if (!currentProductId) return null;

  const basePath = `/product/${currentProductId}`;

  return (
    <div className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Product Name Header */}
      <div className="flex h-12 items-center border-b border-sidebar-border px-3">
        <h2 className="truncate text-[13px] font-semibold text-sidebar-foreground tracking-tight">
          {currentProduct?.name || "Loading..."}
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-thin p-2">
        {/* Quick Capture CTA */}
        <QuickCaptureButton />

        <Separator className="my-3 bg-sidebar-border" />

        <NavItem to={`${basePath}/home`} icon={Home} label="Home" />

        <Separator className="my-3 bg-sidebar-border" />

        <div className="space-y-0.5">
          <NavItem to={`${basePath}/problems`} icon={AlertCircle} label="Problems" />
          <NavItem to={`${basePath}/hypotheses`} icon={Lightbulb} label="Hypotheses" />
          <NavItem to={`${basePath}/experiments`} icon={FlaskConical} label="Experiments" />
          <NavItem to={`${basePath}/decisions`} icon={CheckCircle} label="Decisions" />
          <NavItem to={`${basePath}/artifacts`} icon={Paperclip} label="Artifacts" />
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        <NavItem to={`${basePath}/timeline`} icon={Clock} label="Timeline" />

        <Separator className="my-3 bg-sidebar-border" />

        <div className="space-y-0.5">
          <NavItem to={`${basePath}/taxonomy`} icon={Tags} label="Manage Context" />
          <NavItem to={`${basePath}/exports`} icon={Download} label="Exports" />
          <NavItem to={`${basePath}/settings`} icon={Settings} label="Settings" />
        </div>
      </nav>
    </div>
  );
}
