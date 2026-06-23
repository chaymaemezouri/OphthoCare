import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import type { DocumentHeaderContext, DocumentRenderPayload } from './documents.types';

@Injectable()
export class DocumentTemplateService {
  constructor(private readonly config: ConfigService) {}

  verifyBaseUrl() {
    return this.config.get<string>('PUBLIC_APP_URL', 'https://ophthocare.com');
  }

  buildVerifyUrl(type: 'prescription' | 'receipt' | 'report', verificationUuid: string) {
    return `${this.verifyBaseUrl()}/verify/${type}/${verificationUuid}`;
  }

  async buildHtml(header: DocumentHeaderContext, doc: DocumentRenderPayload): Promise<string> {
    const qr = await QRCode.toDataURL(doc.verifyUrl, { margin: 1, width: 96 });
    const sig = doc.signatureDataUrl
      ? `<img src="${doc.signatureDataUrl}" alt="Signature" style="max-height:64px;margin-top:8px"/>`
      : '<p style="margin-top:24px;border-top:1px solid #ccc;padding-top:8px;font-size:11px">Signature du médecin</p>';

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
<style>
  body{font-family:system-ui,sans-serif;color:#111;margin:0;padding:24px;font-size:13px}
  .hdr{border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px}
  .logo{font-weight:800;font-size:18px;color:#0f172a}
  .doc-title{font-size:16px;font-weight:700;margin:12px 0}
  .body{border:1px solid #e2e8f0;border-radius:8px;padding:16px;line-height:1.55}
  .ftr{margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#475569}
  .qr img{width:72px;height:72px}
</style></head><body>
  <div class="hdr">
    <div class="logo">${escapeHtml(header.platformName)}</div>
    <p><strong>${escapeHtml(header.doctorName)}</strong> — ${escapeHtml(header.specialtyName)}</p>
    ${header.orderNumber ? `<p>N° ordre : ${escapeHtml(header.orderNumber)}</p>` : ''}
    ${header.siteAddress ? `<p>${escapeHtml(header.siteAddress)}</p>` : ''}
    ${header.sitePhone ? `<p>Tél. ${escapeHtml(header.sitePhone)}</p>` : ''}
  </div>
  <p class="doc-title">${escapeHtml(doc.title)}</p>
  <p><strong>Patient :</strong> ${escapeHtml(doc.patientName)}${doc.patientDob ? ` — ${escapeHtml(doc.patientDob)}` : ''}</p>
  <div class="body">${doc.bodyHtml}</div>
  ${sig}
  <div class="ftr">
    <div>
      ${doc.footerNumber ? `<p>Document n° ${escapeHtml(doc.footerNumber)}</p>` : ''}
      <p>Généré le ${escapeHtml(doc.generatedAt)}</p>
    </div>
    <div class="qr"><img src="${qr}" alt="QR authenticité"/></div>
  </div>
</body></html>`;
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
