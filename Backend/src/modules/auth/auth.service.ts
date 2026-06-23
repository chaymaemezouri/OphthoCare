import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type { User } from '@prisma/client';
import { PlatformAuditAction, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@/common/audit/audit-log.service';
import { parseBrowserLabel } from '@/common/http/request-meta';
import { DoctorsSpaceService } from '@/modules/doctors/doctors-space.service';
import { authOtpChallengeClient } from '@/prisma/auth-otp.client';
import { UsersService, SanitizedUser } from '@/modules/users/users.service';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import type { RequestUser } from './auth.types';

const OTP_PURPOSE_LOGIN = 'sms_2fa_login';
const OTP_PURPOSE_ENABLE = 'sms_2fa_enable';

const ACCESS_JWT_EXPIRES = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

function sha256hex(val: string): string {
  return createHash('sha256').update(val, 'utf8').digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly doctorsSpaceService: DoctorsSpaceService,
    private readonly auditLog: AuditLogService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(
    dto: LoginDto,
    meta?: { ip?: string; userAgent?: string },
  ) {
    if (dto.pendingToken && dto.twoFactorCode) {
      return this.verifyTwoFactorAndIssueTokens(dto.pendingToken, dto.twoFactorCode, meta);
    }
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email et mot de passe requis');
    }
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.password))) {
      await this.prisma.failedLoginAttempt
        .create({
          data: {
            email: dto.email.trim().toLowerCase(),
            ip: meta?.ip?.slice(0, 64) ?? null,
          },
        })
        .catch(() => undefined);
      await this.auditLog.log({
        action: PlatformAuditAction.LOGIN_FAILED,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        entityId: dto.email,
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    const ext = user as User & { twoFactorSmsEnabled?: boolean };
    if (ext.twoFactorSmsEnabled) {
      if (!user.phoneNumber?.trim()) {
        throw new BadRequestException(
          '2FA SMS activé sans numéro de téléphone — désactivez la 2FA ou renseignez un mobile.',
        );
      }
      await authOtpChallengeClient(this.prisma).deleteMany({
        where: {
          userId: user.id,
          purpose: OTP_PURPOSE_LOGIN,
          consumedAt: null,
        },
      });
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = await bcrypt.hash(code, 10);
      await authOtpChallengeClient(this.prisma).create({
        data: {
          userId: user.id,
          codeHash,
          purpose: OTP_PURPOSE_LOGIN,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
      const pendingToken = this.jwtService.sign(
        { sub: user.id, typ: '2fa_pending' },
        { expiresIn: '5m' },
      );
      this.logger.warn(`[SMS 2FA — simulation] ${user.email} code OTP : ${code}`);
      return {
        twoFactorRequired: true,
        pendingToken,
        message:
          'Un code de vérification a été généré (voir les logs serveur si aucun fournisseur SMS). Saisissez-le pour terminer la connexion.',
      };
    }

    return this.issueTokensForUser(user, meta);
  }

  async logout(refreshToken?: string) {
    const raw = refreshToken?.trim();
    if (raw) {
      const hash = sha256hex(raw);
      const row = await this.prisma.refreshToken.findFirst({
        where: { tokenHash: hash },
        select: { id: true },
      });
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (row) {
        await this.prisma.activeSession.deleteMany({ where: { refreshTokenId: row.id } });
      }
    }
    return { ok: true, message: 'Déconnexion effectuée.' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.trim(), deletedAt: null },
    });
    const generic = {
      message:
        'Si un compte correspond à cet e-mail, un lien de réinitialisation a été préparé (voir les logs en développement).',
    };
    if (!user) return generic;

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const raw = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256hex(raw),
        expiresAt,
      },
    });
    this.logger.warn(`[Réinitialisation mot de passe] ${user.email} — jeton (1h, usage unique) : ${raw}`);
    return {
      ...generic,
      ...(process.env.PASSWORD_RESET_RETURN_TOKEN === 'true' ? { resetToken: raw } : {}),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const raw = token.trim();
    if (!raw) throw new BadRequestException('Jeton requis');
    const tokenHash = sha256hex(raw);
    const row = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!row) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré');
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { password: await bcrypt.hash(newPassword, 10) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' };
  }

  async validateRequestUser(userId: string): Promise<RequestUser> {
    const user = await this.usersService.findById(userId);
    if (user.role === UserRole.doctor) {
      const d = await this.prisma.doctor.findFirst({
        where: { userId, deletedAt: null },
        select: { id: true },
      });
      if (d?.id) {
        try {
          await this.doctorsSpaceService.ensureBootstrapForDoctor(d.id);
        } catch (e) {
          this.logger.warn(`ensureBootstrap doctor: ${String(e)}`);
        }
      }
    }
    const doctorSpaceId = await this.resolveDoctorSpaceId(userId, user.role);
    return { ...user, doctorSpaceId };
  }

  /** @deprecated Utiliser validateRequestUser */
  async validateUser(id: string): Promise<SanitizedUser> {
    return this.usersService.findById(id);
  }

  async refreshToken(refreshToken?: string) {
    const raw = refreshToken?.trim();
    if (!raw) {
      throw new UnauthorizedException('Refresh token requis');
    }
    const tokenHash = sha256hex(raw);
    const row = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!row?.user || !row.user.isActive || row.user.deletedAt) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = row.user;
    const newRaw = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_MS);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256hex(newRaw),
          expiresAt,
        },
      }),
    ]);

    return this.buildTokenResponse(user, newRaw);
  }

  async sendSms2faSetupCode(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user?.phoneNumber?.trim()) {
      throw new BadRequestException('Renseignez un numéro de téléphone sur votre profil avant d’activer la 2FA SMS.');
    }
    await authOtpChallengeClient(this.prisma).deleteMany({
      where: { userId, purpose: OTP_PURPOSE_ENABLE, consumedAt: null },
    });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await authOtpChallengeClient(this.prisma).create({
      data: {
        userId,
        codeHash,
        purpose: OTP_PURPOSE_ENABLE,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    this.logger.warn(`[2FA SMS activation] user=${user.email} code=${code}`);
    return { message: 'Code généré (journal serveur). Saisissez-le pour activer la 2FA SMS.' };
  }

  async enableSms2fa(userId: string, code: string) {
    const ok = await this.consumeOtp(userId, OTP_PURPOSE_ENABLE, code);
    if (!ok) throw new BadRequestException('Code incorrect ou expiré');
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSmsEnabled: true,
        twoFactorEnabled: true,
      } as Prisma.UserUpdateInput,
    });
    return { twoFactorSmsEnabled: true };
  }

  async disableSms2fa(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSmsEnabled: false } as Prisma.UserUpdateInput,
    });
    await authOtpChallengeClient(this.prisma).deleteMany({ where: { userId } });
    return { twoFactorSmsEnabled: false };
  }

  private async consumeOtp(userId: string, purpose: string, plainCode: string): Promise<boolean> {
    const row = await authOtpChallengeClient(this.prisma).findFirst({
      where: {
        userId,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return false;
    const match = await bcrypt.compare(plainCode, row.codeHash);
    if (!match) return false;
    await authOtpChallengeClient(this.prisma).update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    });
    return true;
  }

  private async verifyTwoFactorAndIssueTokens(
    pendingToken: string,
    code: string,
    meta?: { ip?: string; userAgent?: string },
  ) {
    let payload: { sub: string; typ?: string };
    try {
      payload = this.jwtService.verify<{ sub: string; typ?: string }>(pendingToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Session 2FA expirée — reconnectez-vous.');
    }
    if (payload.typ !== '2fa_pending') {
      throw new UnauthorizedException('Jeton 2FA invalide');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    const ok = await this.consumeOtp(user.id, OTP_PURPOSE_LOGIN, code);
    if (!ok) throw new UnauthorizedException('Code SMS incorrect ou expiré');
    return this.issueTokensForUser(user, meta);
  }

  private async resolveDoctorSpaceId(userId: string, role: UserRole): Promise<string | null> {
    if (role === UserRole.doctor) {
      const space = await this.prisma.doctorSpace.findFirst({
        where: { doctor: { userId, deletedAt: null } },
        select: { id: true },
      });
      return space?.id ?? null;
    }
    if (role === UserRole.secretary) {
      const link = await this.prisma.secretaryDoctorSpace.findUnique({
        where: { userId },
        select: { doctorSpaceId: true },
      });
      return link?.doctorSpaceId ?? null;
    }
    if (role === UserRole.trainee) {
      const link = await this.prisma.traineeDoctorSpace.findUnique({
        where: { userId },
        select: { doctorSpaceId: true },
      });
      return link?.doctorSpaceId ?? null;
    }
    return null;
  }

  private async issueTokensForUser(
    user: User,
    meta?: { ip?: string; userAgent?: string },
  ) {
    const raw = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_MS);
    const refreshRow = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256hex(raw),
        expiresAt,
      },
    });
    await this.prisma.activeSession
      .create({
        data: {
          userId: user.id,
          refreshTokenId: refreshRow.id,
          ip: meta?.ip?.slice(0, 64) ?? null,
          userAgent: meta?.userAgent?.slice(0, 512) ?? null,
          browser: parseBrowserLabel(meta?.userAgent),
        },
      })
      .catch(() => undefined);
    await this.auditLog.log({
      userId: user.id,
      action: PlatformAuditAction.LOGIN_SUCCESS,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });
    return this.buildTokenResponse(user, raw);
  }

  private async buildTokenResponse(user: User, refreshRaw: string) {
    const doctorSpaceId = await this.resolveDoctorSpaceId(user.id, user.role);
    const access_token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        doctorSpaceId: doctorSpaceId ?? null,
      },
      { expiresIn: ACCESS_JWT_EXPIRES } as Record<string, unknown>,
    );
    return {
      access_token,
      refresh_token: refreshRaw,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lang: (user as { lang?: string }).lang ?? 'fr',
        doctorSpaceId: doctorSpaceId ?? undefined,
      },
    };
  }
}
