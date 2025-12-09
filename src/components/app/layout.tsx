import { useLocation } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isOfficeMap = location.pathname.endsWith("/office-map") || location.pathname === "/office-map";
  
  if (isOfficeMap) {
    return <div className="w-full h-screen overflow-hidden">{children}</div>;
  }
  
  return <div className="px-4 lg:px-8 py-4">{children}</div>;
}
