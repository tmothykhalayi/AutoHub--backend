

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { BranchService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @ApiOperation({ summary: 'Create branch', description: 'Create a new branch location' })
  @ApiBody({ type: CreateBranchDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Branch successfully created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid branch data' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all branches', description: 'Retrieve all branch locations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all branches' })
  findAll() {
    return this.branchService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID', description: 'Retrieve a specific branch by its ID' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the branch' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Branch not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch', description: 'Update a branch by its ID' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiBody({ type: UpdateBranchDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Branch successfully updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Branch not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid branch data' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete branch', description: 'Delete a branch by its ID' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Branch successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Branch not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.remove(id);
  }
}
