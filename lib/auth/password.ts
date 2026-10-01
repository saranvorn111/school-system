import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// scrypt is a memory-hard, adaptive hash built into Node — no native addon needed.
// Stored format: scrypt$N$r$p$salt$hash  (so parameters can be raised later
// without breaking existing hashes).
const N = 16384;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer, n: number, rr: number, pp: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, KEY_LENGTH, { N: n, r: rr, p: pp, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, r, p);
  return ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, rr, pp, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await derive(password, Buffer.from(salt, "base64"), +n, +rr, +pp);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when the account doesn't exist, so a login for an unknown user takes
// as long as one for a real user (prevents discovering valid usernames by timing).
let dummyHash: Promise<string> | undefined;
export function getDummyHash() {
  return (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));
}

/** Readable temporary password for admin resets, e.g. "Tmp-7kq2-Xp9m". */
export function generateTempPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return `Tmp-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}
