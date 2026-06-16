import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth"

export async function proxy(request: NextRequest) {
    const auth = await getAuth()
    const session = await auth.api.getSession({
        headers: request.headers
    })


    if (!session) {
        return NextResponse.redirect(new URL("/admin-login", request.url))
    }

    if (session?.user?.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/admin/:path*"]
}
