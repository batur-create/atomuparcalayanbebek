import assert from "node:assert/strict";
import { createECDH, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { base64url } from "../server/push.js";

const ece = createRequire(import.meta.url)("http_ece");

// A browser-like push subscription whose messages we can decrypt.
export function pushReceiver() {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = randomBytes(16);
  return {
    subscription: (endpoint) => ({
      endpoint,
      keys: {
        p256dh: ecdh.getPublicKey().toString("base64url"),
        auth: auth.toString("base64url"),
      },
    }),
    decrypt: (body) =>
      ece
        .decrypt(Buffer.from(body), {
          version: "aes128gcm",
          privateKey: ecdh,
          authSecret: auth.toString("base64url"),
        })
        .toString("utf8"),
  };
}

export async function verifyVapid(header, endpoint, publicKey) {
  const [, token, key] = header.match(/^vapid t=([^,]+), k=(.+)$/) || [];
  assert.ok(token, "VAPID header has a token");
  assert.equal(key, publicKey);
  const [head, claims, signature] = token.split(".");
  const verifier = await crypto.subtle.importKey(
    "raw",
    base64url.decode(publicKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  assert.ok(
    await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      verifier,
      base64url.decode(signature),
      new TextEncoder().encode(`${head}.${claims}`),
    ),
    "VAPID signature verifies",
  );
  const body = JSON.parse(new TextDecoder().decode(base64url.decode(claims)));
  assert.equal(body.aud, new URL(endpoint).origin);
  assert.ok(body.exp > Date.now() / 1000 && body.exp <= Date.now() / 1000 + 86400);
  return body;
}

// A stand-in push service that records what the server sends.
export async function fakePushService() {
  const received = [];
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      received.push({ path: req.url, headers: req.headers, body: Buffer.concat(chunks) });
      res.writeHead(201);
      res.end();
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    received,
    url: (path) => `http://127.0.0.1:${server.address().port}${path}`,
    close: () => new Promise((r) => server.close(r)),
  };
}

export async function waitFor(check, timeout = 8000, label = "condition") {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const value = await check();
    if (value) return value;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

export async function freePort() {
  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  await new Promise((r) => server.close(r));
  return port;
}
