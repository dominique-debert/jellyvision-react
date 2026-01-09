import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-base-300 text-base-content w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`fixed right-0 top-10 bottom-10 overflow-auto transition-all duration-300 ${
          isCollapsed ? "left-30" : "left-74"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
