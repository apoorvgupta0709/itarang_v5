import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { normalizeRole } from "@/lib/utils";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Mapping for role-specific dashboard paths
  const roleDashboards: Record<string, string> = {
    ceo: "/ceo",
    business_head: "/business-head",
    sales_head: "/sales-head",
    sales_manager: "/sales-manager",
    sales_executive: "/sales-executive",
    finance_controller: "/finance-controller",
    inventory_manager: "/inventory-manager",
    service_engineer: "/service-engineer",
    sales_order_manager: "/sales-order-manager",
    dealer: "/dealer-portal",
  };

  // ---------- 1) NOT LOGGED IN ----------
  if (!user) {
    // Allow auth + login + api routes (important for OAuth/callbacks and server actions)
    if (
      path === "/login" ||
      path.startsWith("/api") ||
      path.startsWith("/auth")
    ) {
      return response;
    }

    // Top-level modules (Phase A + future)
    const modulePrefixes = [
      "/inventory",
      "/product-catalog",
      "/oem-onboarding",
      "/deals",
      "/leads",
      "/approvals",
      "/orders",
      "/provisions",
      "/disputes",
    ];

    const isRoleDashboard = Object.values(roleDashboards).some((d) => path.startsWith(d));
    const isModuleRoute = modulePrefixes.some((p) => path.startsWith(p));

    // Root is protected in your product behavior (forces login)
    if (path === "/" || isRoleDashboard || isModuleRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return response;
  }

  // ---------- 2) LOGGED IN ----------
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const rawRole = profile?.role || "user";
  const role = normalizeRole(rawRole);

  const myDashboard = roleDashboards[role] || "/";

  // Redirect away from /login, and optionally from / and /dashboard
  if (path === "/login") {
    return NextResponse.redirect(new URL(myDashboard, request.url));
  }

  if (path === "/" || path === "/dashboard") {
    if (myDashboard !== "/") {
      return NextResponse.redirect(new URL(myDashboard, request.url));
    }
    return response; // allow '/' for 'user'
  }

  // Role-based path protection: block users entering other role dashboard paths (unless CEO)
  const roles = Object.keys(roleDashboards);
  const matchedRole = roles.find((r) => path.startsWith(roleDashboards[r]));

  if (matchedRole && matchedRole !== role && role !== "ceo") {
    return NextResponse.redirect(new URL(myDashboard, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};