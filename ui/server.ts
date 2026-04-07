import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

Deno.serve({ port: 8000 }, async (req) => {
  const url = new URL(req.url);
  
  // Proxy /__admin to WireMock server
  if (url.pathname.startsWith("/__admin")) {
    const wiremockUrl = Deno.env.get("WIREMOCK_URL") || "http://localhost:8080";
    const targetUrl = new URL(url.pathname + url.search, wiremockUrl);
    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    
    // Wait for the response and return it directly
    try {
      const response = await fetch(proxyReq);
      
      // Filter out encodings to prevent issues with Deno fetch handling compressed bodies manually
      const newHeaders = new Headers(response.headers);
      newHeaders.delete("content-encoding");
      
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (err) {
      console.error("Proxy error:", err);
      return new Response("WireMock Proxy Error", { status: 502 });
    }
  }

  // Serve static UI assets for the SPA
  const response = await serveDir(req, {
    fsRoot: "./client/dist",
    quiet: true,
  });

  // SPA fallback to index.html if not found (e.g. for client-side routing)
  if (response.status === 404) {
      return await serveDir(new Request(new URL("/", req.url)), {
          fsRoot: "./client/dist",
          quiet: true
      });
  }

  return response;
});
