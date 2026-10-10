import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthProvider from "./auth/AuthProvider";
import ErrorBoundary from "./ErrorBoundary";
import "./index.css";

// No <BrowserRouter> here: src/App.tsx renders <RouterProvider router={router}>
// where `router` comes from createBrowserRouter. A data router provides its own
// <Router> context, so wrapping it in <BrowserRouter> nests two routers and
// react-router throws "You cannot render a <Router> inside another <Router>".
// AuthProvider stays outside the router - it provides Convex session context,
// not routing context.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
