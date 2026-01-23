
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    if (!user) {
        // Protected routes check
        const isProtectedRoute =
            path.startsWith("/ceo") ||
            path.startsWith("/business-head") ||
            path.startsWith("/sales-head") ||
            path.startsWith("/sales-manager") ||
            path.startsWith("/sales-executive") ||
            path.startsWith("/finance-controller") ||
            path.startsWith("/inventory-manager") ||
            path.startsWith("/service-engineer") ||
            path.startsWith("/sales-order-manager") ||
            path.startsWith("/dealer-portal") ||
            path.startsWith("/inventory") ||
            path.startsWith("/product-catalog") ||
            path.startsWith("/oem-onboarding") ||
            path.startsWith("/deals") ||
            path.startsWith("/leads");

        if (isProtectedRoute && !path.startsWith("/login")) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
        return response;
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    // Standardize role to lowercase for lookup
    const rawRole = profile?.role || 'user';
    const role = rawRole.toLowerCase();

    // Mapping for role-specific dashboard paths
    const roleDashboards: Record<string, string> = {
        ceo: '/ceo',
        business_head: '/business-head',
        sales_head: '/sales-head',
        sales_manager: '/sales-manager',
        sales_executive: '/sales-executive',
        finance_controller: '/finance-controller',
        inventory_manager: '/inventory-manager',
        service_engineer: '/service-engineer',
        sales_order_manager: '/sales-order-manager',
        dealer: '/dealer-portal',
    };

    // 1. Root and Dashboard path redirection
    if (path === '/' || path === '/dashboard' || path === '/login') {
        const dashboard = roleDashboards[role];
        if (dashboard) {
            return NextResponse.redirect(new URL(dashboard, request.url));
        }
        // Fallback for 'user' role or undefined dashboards is to allow '/', 
        // which will be handled by src/app/(dashboard)/page.tsx
        if (path === '/login') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 2. Role-based path protection
    // Check if the current path belongs to any specific role
    const roles = Object.keys(roleDashboards);
    const matchedRole = roles.find(r => path.startsWith(roleDashboards[r]));

    // Allow CEO to access everything, others only their own paths
    if (matchedRole && matchedRole !== role && role !== 'ceo') {
        // Redirect unauthorized access to their actual dashboard or root
        return NextResponse.redirect(new URL(roleDashboards[role] || '/', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
