import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  backdropUrl?: string;
}

export function Layout({ children, backdropUrl }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const defaultGradient =
    "linear-gradient(to bottom right, oklch(29% 0.05 282.93), oklch(29% 0.01 294.99))";

  // Calculate sidebar width in pixels: collapsed = 80px (left-20 = 5rem), expanded = 256px (left-64 = 16rem)
  const sidebarWidth = isCollapsed ? 80 : 256;

  return (
    <div
      className="min-h-screen text-base-content w-full"
      style={{
        background: backdropUrl
          ? `url(${backdropUrl}) calc(center + ${sidebarWidth / 2}px)/cover no-repeat fixed, ${defaultGradient}`
          : defaultGradient,
        backgroundBlendMode: backdropUrl ? "multiply" : "normal",
        backgroundPosition: backdropUrl ? `calc(50% + ${sidebarWidth / 2}px) center` : undefined,
      }}
    >
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`fixed right-0 top-10 bottom-10 overflow-auto transition-all duration-300 ${
          isCollapsed ? "left-20" : "left-64"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
