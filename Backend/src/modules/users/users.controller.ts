import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService, SanitizedUser } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import { Prisma } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  async create(@Body() createUserDto: CreateUserDto): Promise<SanitizedUser> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<[SanitizedUser[], number]> {
    return this.usersService.findAll(
      skip ? parseInt(skip, 10) || 0 : 0,
      take ? parseInt(take, 10) || 10 : 10,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMe(@ReqUser() user: SanitizedUser): Promise<SanitizedUser> {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async patchMe(
    @ReqUser() user: SanitizedUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<SanitizedUser> {
    const data: Record<string, unknown> = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber;
    if (dto.password !== undefined) data.password = dto.password;
    return this.usersService.update(user.id, data as Prisma.UserUpdateInput);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string): Promise<SanitizedUser> {
    return this.usersService.findById(id);
  }
}
