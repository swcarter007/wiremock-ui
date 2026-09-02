import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

function getDataDir(): string {
  const envDir = Deno.env.get("WIREMOCK_DATA_DIR");
  if (envDir) return envDir;
  
  // Try common relative paths
  try {
    if (Deno.statSync("../wiremock_data").isDirectory) return "../wiremock_data";
  } catch (_) {
    // fallback
  }
  try {
    if (Deno.statSync("./wiremock_data").isDirectory) return "./wiremock_data";
  } catch (_) {
    // fallback
  }
  return "./wiremock_data";
}

const configFilePath = join(getDataDir(), "ui_config.json");

Deno.serve({ port: 8000 }, async (req) => {
  const url = new URL(req.url);

  // API Config endpoints for UI presets, faults & folder persistence in wiremock_data
  if (url.pathname === "/api/config") {
    if (req.method === "GET") {
      try {
        const content = await Deno.readTextFile(configFilePath);
        return new Response(content, {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        // Return 404 or empty if not created yet
        return new Response(JSON.stringify({ notFound: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (req.method === "POST") {
      try {
        const bodyText = await req.text();
        await Deno.writeTextFile(configFilePath, bodyText);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        console.error("Failed to write ui_config.json:", err);
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }

  // Proxy /__admin to WireMock server
  if (url.pathname.startsWith("/__admin")) {
    const wiremockUrl = Deno.env.get("WIREMOCK_URL") || "http://localhost:8080";
    const targetUrl = new URL(url.pathname + url.search, wiremockUrl);
    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Wait for the response and return it directly
    try {
      const response = await fetch(proxyReq);

      // Filter out encodings to prevent issues with Deno fetch handling compressed bodies manually
      const newHeaders = new Headers(response.headers);
      newHeaders.delete("content-encoding");

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });
    } catch (err) {
      console.error("Proxy error:", err);
      return new Response("WireMock Proxy Error", { status: 502 });
    }
  }

  // Serve static UI assets for the SPA
  const response = await serveDir(req, {
    fsRoot: "./client/dist",
    quiet: true
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
