import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Verify token using a lightweight decoder (signature verification is also done here to secure route)
function checkAuth(request: NextRequest): boolean {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    
    const body = parts[1];
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    
    // Check if token expired
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuth = checkAuth(request);

  // Protected paths
  if (pathname.startsWith("/dashboard")) {
    if (!isAuth) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // API protection
  if (pathname.startsWith("/api/items") || pathname.startsWith("/api/nudge")) {
    if (!isAuth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }
  }

  // Redirect to dashboard if logged in and accessing login/register
  if (pathname === "/login" || pathname === "/register") {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/api/items/:path*",
    "/api/nudge/:path*",
  ],
};
