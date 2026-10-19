import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 0, retry: false },
  },
});

// BASE_URL is injected by Vite from the `base` config option.
// Standalone Vercel: "/"  →  router basepath "/"
// Integrated build:  "/studio/"  →  router basepath "/studio"
const basepath = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

const router = createRouter({
  routeTree,
  context: { queryClient },
  basepath,
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("No #root element found in index.html");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
