import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';

@ApiTags('support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @ApiOperation({
    summary: 'Create support ticket',
    description: 'Create a new support ticket or inquiry',
  })
  @ApiBody({ type: CreateSupportDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Support ticket successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid support ticket data',
  })
  create(@Body() createSupportDto: CreateSupportDto) {
    return this.supportService.create(createSupportDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all support tickets',
    description: 'Retrieve all support tickets and inquiries',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all support tickets',
  })
  findAll() {
    return this.supportService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get support ticket by ID',
    description: 'Retrieve a specific support ticket by its ID',
  })
  @ApiParam({ name: 'id', description: 'Support ticket ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the support ticket',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Support ticket not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supportService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update support ticket',
    description: 'Update a support ticket by its ID',
  })
  @ApiParam({ name: 'id', description: 'Support ticket ID' })
  @ApiBody({ type: UpdateSupportDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Support ticket successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Support ticket not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid support ticket data',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupportDto: UpdateSupportDto,
  ) {
    return this.supportService.update(id, updateSupportDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete support ticket',
    description: 'Delete a support ticket by its ID',
  })
  @ApiParam({ name: 'id', description: 'Support ticket ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Support ticket successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Support ticket not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.supportService.remove(id);
  }
}
