import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid login request body." }, { status: 400 });
  }

  const upstreamResponse = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await upstreamResponse.text();
  const responseHeaders = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");

  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  return new NextResponse(responseText, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}
