import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

/** Document index « doctors » (guide §2.3). */
export type DoctorIndexDocument = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  specialtyCode: string;
  /** Libellé spécialité (alias guide specialtyLabel) */
  specialtyLabel: string;
  specialtyName: string;
  city: string;
  country: string;
  street?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  consultationPrice: number;
  minPrice: number;
  maxPrice: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isCertified: boolean;
  languages: string[];
  location?: { lat: number; lon: number };
};

export type DoctorSearchQuery = {
  q?: string;
  specialtyCode?: string;
  city?: string;
  minRating?: number;
  maxPrice?: number;
  isVerified?: boolean;
  isCertified?: boolean;
  from?: number;
  size?: number;
};

export type DoctorSearchIdsResult = {
  ids: string[];
  total: number;
};

@Injectable()
export class DoctorSearchIndexService implements OnModuleInit {
  private readonly logger = new Logger(DoctorSearchIndexService.name);
  private client: Client | null = null;

  constructor(private readonly config: ConfigService) {}

  getIndexName(): string {
    return this.config.get<string>('ELASTICSEARCH_DOCTORS_INDEX')?.trim() || 'doctors';
  }

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('ELASTICSEARCH_URL')?.trim());
  }

  isClientReady(): boolean {
    return this.client !== null;
  }

  async onModuleInit(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.log('ELASTICSEARCH_URL absent — recherche SQL (Prisma) uniquement.');
      return;
    }
    const node = this.config.get<string>('ELASTICSEARCH_URL')!.trim();
    try {
      const c = new Client({ node });
      await c.ping();
      this.client = c;
      await this.ensureIndex();
      this.logger.log(`Elasticsearch connecté — index « ${this.getIndexName()} »`);
    } catch (err) {
      this.logger.warn(`Elasticsearch indisponible (${String(err)}). Repli Prisma.`);
      this.client = null;
    }
  }

  private async ensureIndex(): Promise<void> {
    if (!this.client) return;
    const indexName = this.getIndexName();
    const exists = await this.client.indices.exists({ index: indexName });
    if (exists) return;
    await this.client.indices.create({
      index: indexName,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          firstName: { type: 'text' },
          lastName: { type: 'text' },
          fullName: { type: 'text' },
          specialtyCode: { type: 'keyword' },
          specialtyLabel: { type: 'text' },
          specialtyName: { type: 'text' },
          city: { type: 'text' },
          country: { type: 'keyword' },
          street: { type: 'text' },
          postalCode: { type: 'keyword' },
          lat: { type: 'float' },
          lng: { type: 'float' },
          consultationPrice: { type: 'float' },
          minPrice: { type: 'float' },
          maxPrice: { type: 'float' },
          rating: { type: 'float' },
          reviewCount: { type: 'integer' },
          isVerified: { type: 'boolean' },
          isCertified: { type: 'boolean' },
          languages: { type: 'keyword' },
          location: { type: 'geo_point' },
        },
      },
    });
    this.logger.log(`Index Elasticsearch « ${indexName} » créé`);
  }

  toDocument(payload: {
    id: string;
    firstName?: string;
    lastName?: string;
    specialtyCode: string;
    specialtyName: string;
    city: string;
    country?: string;
    street?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    consultationPrice: number;
    minPrice?: number;
    maxPrice?: number;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    isCertified: boolean;
    languages?: string[];
  }): DoctorIndexDocument {
    const fullName = `${payload.firstName ?? ''} ${payload.lastName ?? ''}`.trim();
    const basePrice = payload.consultationPrice;
    const minP = payload.minPrice ?? basePrice;
    const maxP = payload.maxPrice ?? basePrice;
    const langs = (payload.languages ?? []).filter(Boolean);
    if (langs.length === 0) langs.push('fr');
    const doc: DoctorIndexDocument = {
      id: payload.id,
      firstName: payload.firstName,
      lastName: payload.lastName,
      fullName: fullName || (payload.specialtyName ?? ''),
      specialtyCode: payload.specialtyCode,
      specialtyLabel: payload.specialtyName,
      specialtyName: payload.specialtyName,
      city: payload.city,
      country: (payload.country ?? 'MA').trim() || 'MA',
      street: payload.street,
      postalCode: payload.postalCode,
      lat: payload.latitude ?? undefined,
      lng: payload.longitude ?? undefined,
      consultationPrice: basePrice,
      minPrice: minP,
      maxPrice: maxP,
      rating: payload.rating,
      reviewCount: payload.reviewCount,
      isVerified: payload.isVerified,
      isCertified: payload.isCertified,
      languages: [...new Set(langs)],
    };
    if (
      payload.latitude != null &&
      payload.longitude != null &&
      !Number.isNaN(payload.latitude) &&
      !Number.isNaN(payload.longitude)
    ) {
      doc.location = { lat: payload.latitude, lon: payload.longitude };
    }
    return doc;
  }

  async indexDoctor(doc: DoctorIndexDocument): Promise<void> {
    if (!this.client) return;
    const { id, ...body } = doc;
    await this.client.index({
      index: this.getIndexName(),
      id,
      document: { id, ...body },
      refresh: true,
    });
  }

  async removeDoctor(id: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.delete({ index: this.getIndexName(), id, refresh: true });
    } catch {
      /* déjà absent */
    }
  }

  async searchIds(params: DoctorSearchQuery): Promise<DoctorSearchIdsResult> {
    if (!this.client) return { ids: [], total: 0 };
    const filter: object[] = [];
    const must: object[] = [];

    if (params.specialtyCode?.trim()) {
      filter.push({ term: { specialtyCode: params.specialtyCode.trim() } });
    }
    if (params.city?.trim()) {
      filter.push({
        match: {
          city: { query: params.city.trim(), operator: 'and' },
        },
      });
    }
    if (params.minRating != null && !Number.isNaN(params.minRating)) {
      filter.push({ range: { rating: { gte: params.minRating } } });
    }
    if (params.maxPrice != null && !Number.isNaN(params.maxPrice)) {
      filter.push({ range: { minPrice: { lte: params.maxPrice } } });
    }
    if (params.isVerified === true) {
      filter.push({ term: { isVerified: true } });
    }
    if (params.isCertified === true) {
      filter.push({ term: { isCertified: true } });
    }
    if (params.q?.trim()) {
      must.push({
        multi_match: {
          query: params.q.trim(),
          type: 'best_fields',
          fields: [
            'fullName^3',
            'firstName^2',
            'lastName^2',
            'city',
            'specialtyName',
            'specialtyLabel',
            'street',
          ],
          fuzziness: 'AUTO',
        },
      });
    }

    const query =
      must.length > 0
        ? { bool: { filter, must } }
        : { bool: { filter, must: [{ match_all: {} }] } };

    const sort: Array<Record<string, 'asc' | 'desc'>> = [];
    if (params.q?.trim()) sort.push({ _score: 'desc' });
    sort.push({ rating: 'desc' });

    const from = Math.max(0, params.from ?? 0);
    const size = Math.min(Math.max(1, params.size ?? 50), 100);

    const res = await this.client.search({
      index: this.getIndexName(),
      query: query as Record<string, unknown>,
      sort,
      from,
      size,
      track_total_hits: true,
      _source: ['id'],
    });

    const total =
      typeof res.hits.total === 'number'
        ? res.hits.total
        : (res.hits.total as { value?: number })?.value ?? 0;

    const hits = res.hits.hits as { _id?: string; _source?: { id?: string } }[];
    const ids = hits.map((h) => h._source?.id ?? h._id ?? '').filter(Boolean);
    return { ids, total };
  }
}
