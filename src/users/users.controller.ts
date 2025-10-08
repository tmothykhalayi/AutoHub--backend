
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  DefaultValuePipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  ForbiddenException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { SearchUsersDto } from './dto/search-users.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

//@ApiTags('users')
//@ApiBearerAuth()
@Controller('users')
//@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'User created successfully',
    type: UserResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Email already exists' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Users retrieved successfully',
    type: [UserResponseDto]
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('limit', new DefaultValuePipe(10)) limit: number
  ): Promise<{ data: UserResponseDto[]; pagination: any }> {
    return this.usersService.findAll({ page, limit });
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Profile retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  async getProfile(@Req() req: any): Promise<UserResponseDto> {
    return this.usersService.findOne(req.user.userId);
  }

  @Get('search')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Search users (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Users retrieved successfully',
    type: [UserResponseDto]
  })
  async searchUsers(@Query() searchDto: SearchUsersDto): Promise<{ data: UserResponseDto[]; pagination: any }> {
    return this.usersService.searchUsers(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ): Promise<UserResponseDto> {
    // Users can only access their own profile unless they are admins
    if (req.user.role !== Role.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User updated successfully',
    type: UserResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions' 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'User deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'User has active bookings' 
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }

 


  @Patch(':id/verify-email')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Verify user email (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  
  async verifyEmail(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.verifyEmail(id);
  }

  @Get(':id/stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  async getUserStats(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.usersService.getUserStats(id);
  }


  
  @Post(':id/update-last-login')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update user last login timestamp' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Last login updated' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  async updateLastLogin(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.updateLastLogin(id);
  }
}