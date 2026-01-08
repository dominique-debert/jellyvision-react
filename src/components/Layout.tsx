import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-black text-white">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`fixed right-0 top-0 bottom-0 overflow-auto pl-8 transition-all duration-300 ${
          isCollapsed ? "left-20" : "left-64"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
