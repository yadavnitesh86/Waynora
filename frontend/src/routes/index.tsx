import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import ProtectedRoute from "./ProtectedRoute";

const Landing = lazy(() => import("./Landing"));
const LoginPlaceholder = lazy(() => import("./LoginPlaceholder"));
const ChatPlaceholder = lazy(() => import("./ChatPlaceholder"));
const NotFound = lazy(() => import("./NotFound"));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: (
          <Suspense fallback={null}>
            <Landing />
          </Suspense>
        ),
      },
      {
        path: "/signin",
        element: (
          <Suspense fallback={null}>
            <LoginPlaceholder />
          </Suspense>
        ),
      },
      {
        path: "/signup",
        element: (
          <Suspense fallback={null}>
            <LoginPlaceholder />
          </Suspense>
        ),
      },
      {
        path: "/chat",
        element: (
          <Suspense fallback={null}>
            <ProtectedRoute>
              <ChatPlaceholder />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={null}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);
