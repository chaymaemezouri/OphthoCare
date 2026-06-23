import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const PREFIX = 'enc:v1:';

/** Chiffrement AES-256-GCM pour identifiants patients (CIN / passeport). */
@Injectable()
export class PatientNationalIdCryptoService {
  private readonly key: Buffer;

  constructor() {
    this.key = PatientNationalIdCryptoService.resolveKey();
  }

  private static resolveKey(): Buffer {
    const hex = process.env.PATIENT_DATA_ENCRYPTION_KEY?.trim();
    if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) {
      return Buffer.from(hex, 'hex');
    }
    const secret = process.env.JWT_SECRET ?? 'ophthocare-dev-key-change-me';
    return scryptSync(secret, 'patient-national-id-v1', 32);
  }

  isEncrypted(value: string | null | undefined): boolean {
    return Boolean(value?.startsWith(PREFIX));
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plain.trim(), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const buf = Buffer.concat([iv, tag, enc]);
    return PREFIX + buf.toString('base64url');
  }

  decrypt(stored: string): string {
    if (!stored.startsWith(PREFIX)) {
      return stored;
    }
    const raw = Buffer.from(stored.slice(PREFIX.length), 'base64url');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  maskForDisplay(plain: string): string {
    const t = plain.trim();
    if (t.length <= 4) return '****';
    return `****${t.slice(-4)}`;
  }
}
