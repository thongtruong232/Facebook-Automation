import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function encryptSecret(plaintext: string, keyInput = process.env.TOKEN_ENCRYPTION_KEY ?? ""): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt an empty secret.");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, deriveKey(keyInput), iv, {
    authTagLength: AUTH_TAG_LENGTH
  });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(ciphertext: string, keyInput = process.env.TOKEN_ENCRYPTION_KEY ?? ""): string {
  const [version, ivBase64, authTagBase64, encryptedBase64] = ciphertext.split(":");

  if (version !== "v1" || !ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Encrypted secret has an unsupported format.");
  }

  const decipher = createDecipheriv(ALGORITHM, deriveKey(keyInput), Buffer.from(ivBase64, "base64"), {
    authTagLength: AUTH_TAG_LENGTH
  });
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final()
  ]).toString("utf8");
}

export function maskToken(token: string): string {
  if (token.length < 12) {
    return "*".repeat(Math.max(token.length, 4));
  }

  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function deriveKey(keyInput: string): Buffer {
  if (!keyInput) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be configured before encrypting tokens.");
  }

  return createHash("sha256").update(keyInput).digest();
}
