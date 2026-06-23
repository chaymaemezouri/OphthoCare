import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyAdminDto } from './dto/create-specialty-admin.dto';
import { PatchSpecialtyAdminDto } from './dto/patch-specialty-admin.dto';

@ApiTags('Specialties')
@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get()
  findAll() {
    return this.specialtiesService.findAll();
  }

  /** Gabarit dynamique (SpecialtyField[]) — avant la route `:code` seule. */
  @Get(':code/template')
  getTemplate(@Param('code') code: string) {
    return this.specialtiesService.getTemplateByCode(code);
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.specialtiesService.findByCode(code);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  createAdmin(@Body() dto: CreateSpecialtyAdminDto) {
    return this.specialtiesService.createAdmin(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  patchAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchSpecialtyAdminDto,
  ) {
    return this.specialtiesService.patchAdmin(id, dto);
  }
}
