import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2xs focus:left-2xs focus:z-50 focus:bg-surface-raised focus:px-md focus:py-sm focus:rounded-md focus:shadow-md"
      >
        Skip to content
      </a>
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}
