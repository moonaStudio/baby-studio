/**
 * Supabase PKCE uses crypto.subtle.digest("SHA-256", …). React Native / Expo Go often
 * has no subtle → auth-js falls back to "plain" and logs WebCrypto warning; OAuth can break.
 * Import `react-native-get-random-values` before this module (see App.tsx).
 */
import { sha256 } from "@noble/hashes/sha2.js";

function digestSha256(data: BufferSource): Promise<ArrayBuffer> {
  const view =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const hash = sha256(view);
  // `.buffer` alone can be a larger pooled ArrayBuffer; slice() pins exactly 32 bytes for SHA-256.
  return Promise.resolve(hash.slice().buffer);
}

function algorithmName(algorithm: AlgorithmIdentifier): string {
  if (typeof algorithm === "string") return algorithm;
  return (algorithm as { name: string }).name;
}

const root = globalThis as typeof globalThis & { crypto?: Crypto };

if (!root.crypto) {
  root.crypto = {} as Crypto;
}

if (!root.crypto.subtle?.digest) {
  const subtle = {
    digest: async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
      if (algorithmName(algorithm) !== "SHA-256") {
        throw new DOMException("Only SHA-256 is supported for PKCE polyfill", "NotSupportedError");
      }
      return digestSha256(data);
    }
  } as SubtleCrypto;
  Object.defineProperty(root.crypto, "subtle", {
    value: subtle,
    configurable: true,
    enumerable: true,
    writable: true
  });
}
