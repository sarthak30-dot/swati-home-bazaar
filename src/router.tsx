import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Fail fast: with the default of 3 retries and exponential back-off a dead
  // backend keeps every page on skeletons for ~7 seconds before any error state
  // can appear.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, retryDelay: 500, staleTime: 30_000, refetchOnWindowFocus: false },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
