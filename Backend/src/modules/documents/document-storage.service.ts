import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const LOCAL_ROOT = join(process.cwd(), 'private', 'documents');

@Injectable()
export class DocumentStorageService {
  private readonly log = new Logger(DocumentStorageService.name);
  private readonly s3?: S3Client;
  private readonly bucket?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    const key = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secret = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.config.get<string>('AWS_REGION', 'eu-west-1');
    this.bucket = this.config.get<string>('AWS_S3_BUCKET');
    if (key && secret && this.bucket) {
      this.s3 = new S3Client({
        region,
        credentials: { accessKeyId: key, secretAccessKey: secret },
      });
    }
  }

  private useS3() {
    return Boolean(this.s3 && this.bucket);
  }

  buildKey(doctorSpaceId: string, kind: string, id: string) {
    return `${doctorSpaceId}/${kind}/${id}.pdf`;
  }

  async putPdf(key: string, buffer: Buffer): Promise<string> {
    if (this.useS3()) {
      await this.s3!.send(
        new PutObjectCommand({
          Bucket: this.bucket!,
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
        }),
      );
      return `s3:${key}`;
    }
    const full = join(LOCAL_ROOT, key);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, buffer);
    return `local:${key}`;
  }

  async readPdf(storageRef: string): Promise<Buffer> {
    if (storageRef.startsWith('s3:')) {
      const key = storageRef.slice(3);
      const out = await this.s3!.send(
        new GetObjectCommand({ Bucket: this.bucket!, Key: key }),
      );
      const bytes = await out.Body?.transformToByteArray();
      if (!bytes) throw new Error('Empty S3 object');
      return Buffer.from(bytes);
    }
    const key = storageRef.startsWith('local:') ? storageRef.slice(6) : storageRef;
    const full = join(LOCAL_ROOT, key);
    if (!existsSync(full)) throw new Error('PDF file missing');
    return readFileSync(full);
  }

  /** URL signée 24h (S3) ou jeton JWT pour téléchargement local. */
  async createSignedDownloadUrl(storageRef: string, meta: { kind: string; id: string }): Promise<string> {
    const ttlSec = 86400;
    if (storageRef.startsWith('s3:')) {
      const key = storageRef.slice(3);
      return getSignedUrl(
        this.s3!,
        new GetObjectCommand({ Bucket: this.bucket!, Key: key }),
        { expiresIn: ttlSec },
      );
    }
    const token = await this.jwt.signAsync(
      { typ: 'doc_dl', kind: meta.kind, id: meta.id, ref: storageRef, jti: randomUUID() },
      { expiresIn: ttlSec },
    );
    const apiBase = this.config.get<string>('API_PUBLIC_URL', 'http://localhost:3001');
    return `${apiBase}/documents/download?token=${encodeURIComponent(token)}`;
  }

  createLocalReadStream(storageRef: string) {
    const key = storageRef.startsWith('local:') ? storageRef.slice(6) : storageRef;
    return createReadStream(join(LOCAL_ROOT, key));
  }

  localPathExists(storageRef: string) {
    const key = storageRef.startsWith('local:') ? storageRef.slice(6) : storageRef;
    return existsSync(join(LOCAL_ROOT, key));
  }
}
