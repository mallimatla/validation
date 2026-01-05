/**
 * Agents Controller
 * REST API for agent management
 */

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AgentsService, AgentInfo } from './agents.service';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all available agents' })
  findAll() {
    return this.agentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent details' })
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Get(':id/accuracy')
  @ApiOperation({ summary: 'Get agent accuracy metrics' })
  getAccuracy(@Param('id') id: string) {
    return this.agentsService.getAccuracy(id);
  }
}
