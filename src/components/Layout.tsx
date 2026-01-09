import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className="min-h-screen text-base-content w-full"
      style={{
        background:
          "linear-gradient(to bottom right, oklch(29% 0.05 282.93), oklch(29% 0.01 294.99))",
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
