import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get hello message',
    description: 'Returns a welcome message',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the hello message',
    schema: { example: 'Welcome to AutoHub API!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
