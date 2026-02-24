// "use client" directive marks this file as a Client Component. 
// This is strictly required because we are using React hooks (useState) and React Query, 
// which depend on browser APIs and cannot run purely on the server.
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Providers is a wrapper component that encapsulates global client-side Context providers.
 * In Next.js App Router, the RootLayout is a Server Component by default. Since we cannot use 
 * context providers directly inside Server Components, we isolate them here in this Client Component
 * and import it into the RootLayout.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
    // We instantiate the QueryClient inside a useState hook.
    // Why? If we created it outside the component, that single instance would be shared across 
    // all users hitting the server (leading to cross-request data leaks). 
    // Creating it inside useState ensures each user/session gets their own isolated instance of React Query.
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // staleTime defines how long fetched data is considered "fresh".
                        // By setting it to 60 seconds (60 * 1000 ms), we prevent React Query from
                        // immediately refetching the exact same data the moment the component mounts on the client
                        // if that data was already fetched successfully during Server-Side Rendering (SSR).
                        staleTime: 60 * 1000,
                    },
                },
            })
    );

    return (
        // QueryClientProvider makes the queryClient instance accessible to any nested 
        // components that use the `useQuery` or `useMutation` hooks.
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
