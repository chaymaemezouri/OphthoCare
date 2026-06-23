import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Get,
  Res,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LogoutDto } from './dto/logout.dto';
import { Sms2faEnableDto } from './dto/sms-2fa-enable.dto';
import { RefreshBodyDto } from './dto/refresh-body.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { RequestUser } from './auth.types';
import { clientIp, clientUserAgent } from '@/common/http/request-meta';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_COOKIE_PATH = '/auth';

function readRefreshFromCookie(req: Request): string | undefined {
  const raw = req.headers?.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === REFRESH_COOKIE && rest.length) {
      return decodeURIComponent(rest.join('=').trim());
    }
  }
  return undefined;
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_MAX_MS,
    path: AUTH_COOKIE_PATH,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: AUTH_COOKIE_PATH });
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto, {
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    if (result && typeof result === 'object' && 'refresh_token' in result) {
      const rt = (result as { refresh_token: string }).refresh_token;
      if (rt) setRefreshCookie(res, rt);
    }
    return result;
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() body: LogoutDto, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(body.refreshToken);
    clearRefreshCookie(res);
    return { ok: true, message: 'Déconnexion effectuée.' };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() body: RefreshBodyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rt = body.refreshToken?.trim() || readRefreshFromCookie(req);
    const data = await this.authService.refreshToken(rt);
    setRefreshCookie(res, data.refresh_token);
    return data;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@ReqUser() user: RequestUser) {
    return this.authService.validateRequestUser(user.id);
  }

  @Post('password/forgot')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('password/reset')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  /** Alias guide §2.1 */
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPasswordAlias(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /** Alias guide §2.1 */
  @Post('reset-password')
  @HttpCode(200)
  async resetPasswordAlias(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('2fa/sms/send-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  async send2faSetup(@ReqUser() user: RequestUser) {
    return this.authService.sendSms2faSetupCode(user.id);
  }

  @Post('2fa/sms/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  async enable2fa(@ReqUser() user: RequestUser, @Body() dto: Sms2faEnableDto) {
    return this.authService.enableSms2fa(user.id, dto.code);
  }

  @Post('2fa/sms/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  async disable2fa(@ReqUser() user: RequestUser) {
    return this.authService.disableSms2fa(user.id);
  }
}
