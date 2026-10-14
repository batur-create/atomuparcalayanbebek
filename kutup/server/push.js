// Web Push (RFC 8291 payload encryption + RFC 8292 VAPID) on Web Crypto only,
// so the same code runs on Node and on Cloudflare Workers / ChatGPT Sites.
const encoder = new TextEncoder();

export const base64url = {
  encode(bytes) {
    let binary = "";
    for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  decode(text) {
    const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  },
};

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hmac(key, data) {
  const k = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

export async function generateVapidKeys() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const publicKey = await crypto.subtle.exportKey("raw", pair.publicKey);
  const { d } = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return { publicKey: base64url.encode(publicKey), privateKey: d };
}

const signingKeys = new Map();
async function signingKey(keys) {
  if (!signingKeys.has(keys.privateKey)) {
    const pub = base64url.decode(keys.publicKey);
    signingKeys.set(
      keys.privateKey,
      crypto.subtle.importKey(
        "jwk",
        {
          kty: "EC",
          crv: "P-256",
          x: base64url.encode(pub.slice(1, 33)),
          y: base64url.encode(pub.slice(33, 65)),
          d: keys.privateKey,
          ext: true,
        },
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"],
      ),
    );
  }
  return signingKeys.get(keys.privateKey);
}

export async function vapidAuthorization(endpoint, keys, subject) {
  const json = (value) => base64url.encode(encoder.encode(JSON.stringify(value)));
  const unsigned = `${json({ typ: "JWT", alg: "ES256" })}.${json({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    await signingKey(keys),
    encoder.encode(unsigned),
  );
  return `vapid t=${unsigned}.${base64url.encode(signature)}, k=${keys.publicKey}`;
}

// aes128gcm body for one push message (a single record).
export async function encryptPayload(subscription, payload) {
  const clientPublic = base64url.decode(subscription.keys.p256dh);
  const authSecret = base64url.decode(subscription.keys.auth);
  const local = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const serverPublic = new Uint8Array(
    await crypto.subtle.exportKey("raw", local.publicKey),
  );
  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublic,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      local.privateKey,
      256,
    ),
  );
  const ikm = await hmac(
    await hmac(authSecret, shared),
    concat(encoder.encode("WebPush: info\0"), clientPublic, serverPublic, [1]),
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (
    await hmac(prk, concat(encoder.encode("Content-Encoding: aes128gcm\0"), [1]))
  ).slice(0, 16);
  const nonce = (
    await hmac(prk, concat(encoder.encode("Content-Encoding: nonce\0"), [1]))
  ).slice(0, 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, [
    "encrypt",
  ]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      key,
      concat(encoder.encode(payload), [2]),
    ),
  );
  const header = new Uint8Array(21 + serverPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = serverPublic.length;
  header.set(serverPublic, 21);
  return concat(header, ciphertext);
}

// Resolves to the push service HTTP status (201 on success).
// "high" urgency wakes a dozing Android phone right away (RFC 8030 §5.3).
export async function sendPush(subscription, payload, { keys, subject, ttl = 1800, urgency = "normal" }) {
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidAuthorization(subscription.endpoint, keys, subject),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(ttl),
      Urgency: urgency,
    },
    body: await encryptPayload(subscription, payload),
    signal: AbortSignal.timeout(10000),
  });
  return response.status;
}
