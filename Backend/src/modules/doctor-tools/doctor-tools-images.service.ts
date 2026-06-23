import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { DoctorToolsContextService } from './doctor-tools-context.service';
import { CreateMedicalImageDto } from './dto/create-medical-image.dto';

@Injectable()
export class DoctorToolsImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: DoctorToolsContextService,
  ) {}

  async listByPatient(user: RequestUser, patientId: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    await this.ctx.assertPatientAccess(user, patientId);
    const rows = await this.prisma.patientMedicalImage.findMany({
      where: { patientId, doctorSpaceId },
      orderBy: { createdAt: 'desc' },
    });
    return { items: rows.map((r) => this.serialize(r)) };
  }

  async registerUpload(
    user: RequestUser,
    dto: CreateMedicalImageDto,
    fileUrl: string,
    mimeType?: string,
  ) {
    const { doctorId, doctorSpaceId } = await this.ctx.requireDoctor(user);
    await this.ctx.assertPatientAccess(user, dto.patientId);
    const row = await this.prisma.patientMedicalImage.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        doctorSpaceId,
        consultationId: dto.consultationId ?? null,
        examType: dto.examType?.trim() ?? null,
        title: dto.title?.trim() ?? null,
        fileUrl,
        mimeType: mimeType ?? null,
        notes: dto.notes?.trim() ?? null,
      },
    });
    return this.serialize(row);
  }

  async analyze(user: RequestUser, id: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const row = await this.prisma.patientMedicalImage.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!row) throw new NotFoundException('Image introuvable');

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    let analysis: Record<string, unknown>;

    if (apiKey && row.mimeType?.startsWith('image/')) {
      try {
        const baseUrl = process.env.API_URL || 'http://localhost:3001';
        const imageUrl = row.fileUrl.startsWith('http')
          ? row.fileUrl
          : `${baseUrl}${row.fileUrl}`;
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text:
                      'Analyse cette image médicale ophtalmologique (OCT, fond d’œil, etc.). ' +
                      'Réponds en français : observations, éléments suspects, examens complémentaires suggérés. ' +
                      'Rappel : aide à la décision, pas diagnostic définitif.',
                  },
                  { type: 'image_url', image_url: { url: imageUrl } },
                ],
              },
            ],
            max_tokens: 800,
          }),
          signal: AbortSignal.timeout(60_000),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          analysis = {
            provider: 'openai',
            summary: json.choices?.[0]?.message?.content ?? '',
            analyzedAt: new Date().toISOString(),
          };
        } else {
          analysis = this.localAnalysis(row);
        }
      } catch {
        analysis = this.localAnalysis(row);
      }
    } else {
      analysis = this.localAnalysis(row);
    }

    const updated = await this.prisma.patientMedicalImage.update({
      where: { id },
      data: { aiAnalysis: analysis as Prisma.InputJsonValue },
    });
    return this.serialize(updated);
  }

  private localAnalysis(row: {
    examType: string | null;
    title: string | null;
    notes: string | null;
  }): Record<string, unknown> {
    return {
      provider: 'local',
      summary:
        `Examen enregistré (${row.examType ?? 'imagerie'}${row.title ? ` — ${row.title}` : ''}). ` +
        'Analyse IA complète disponible avec OPENAI_API_KEY et une image JPG/PNG/WebP. ' +
        (row.notes ? `Notes : ${row.notes}` : ''),
      analyzedAt: new Date().toISOString(),
    };
  }

  private serialize(row: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    consultationId: string | null;
    examType: string | null;
    title: string | null;
    fileUrl: string;
    mimeType: string | null;
    notes: string | null;
    aiAnalysis: unknown;
  }) {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      patientId: row.patientId,
      consultationId: row.consultationId,
      examType: row.examType,
      title: row.title,
      fileUrl: row.fileUrl,
      mimeType: row.mimeType,
      notes: row.notes,
      aiAnalysis: row.aiAnalysis,
    };
  }
}
