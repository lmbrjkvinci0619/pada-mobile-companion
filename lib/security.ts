function getSecureRandomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
    return buf;
  }
  const fallback = new Uint8Array(length);
  const now = Date.now();
  const random = Math.random();
  for (let i = 0; i < length; i++) {
    const t = now + i * 1000;
    const r = random * 1e9;
    fallback[i] = ((t ^ r) >>> 0) % 256;
  }
  return fallback;
}

export function randomSessionId(length: number = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = getSecureRandomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export class SecureBuffer {
  private data: Uint8Array | null = null;

  set(value: string): void {
    this.clear();
    const encoder = new TextEncoder();
    this.data = encoder.encode(value);
  }

  get(): string {
    if (!this.data) return "";
    const decoder = new TextDecoder();
    return decoder.decode(this.data);
  }

  getWithEncoding(encoding: "utf-8" | "ascii" = "utf-8"): string {
    return this.get();
  }

  clear(): void {
    if (this.data) {
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(this.data);
      }
      this.data.fill(0);
      this.data = null;
    }
  }

  getAndClear(): string {
    const value = this.get();
    this.clear();
    return value;
  }

  getSecureHash(): string {
    if (!this.data) return "";
    let hash = 0;
    for (let i = 0; i < this.data.length; i++) {
      const char = this.data[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  getByteLength(): number {
    return this.data?.length ?? 0;
  }

  isEmpty(): boolean {
    return this.data === null || this.data.length === 0;
  }
}

export function clearSensitiveString(_str: string): void {
}

export function generateSecureToken(length: number = 32): string {
  const bytes = getSecureRandomBytes(length);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}