/**
 * Agents Service
 * Agent configuration and accuracy tracking
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  version: string;
  weight: number;
  targetAccuracy: number;
  description: string;
}

@Injectable()
export class AgentsService {
  private agents: AgentInfo[] = [
    { id: 'aria', name: 'ARIA', role: 'Chief Orchestration Officer', version: '1.0.0', weight: 0, targetAccuracy: 0, description: 'Manages validation workflow and agent coordination' },
    { id: 'marcus', name: 'Marcus', role: 'Chief Market Intelligence Officer', version: '1.0.0', weight: 1.0, targetAccuracy: 0.70, description: 'Validates market size, timing, and opportunity' },
    { id: 'sophia', name: 'Sophia', role: 'Chief Competitive Strategy Officer', version: '1.0.0', weight: 1.2, targetAccuracy: 0.65, description: 'Maps competitive landscape and differentiation' },
    { id: 'david', name: 'David', role: 'Chief Financial Officer', version: '1.0.0', weight: 1.5, targetAccuracy: 0.75, description: 'Validates unit economics and financial viability' },
    { id: 'elena', name: 'Elena', role: 'Chief Customer Validation Officer', version: '1.0.0', weight: 2.0, targetAccuracy: 0.85, description: 'Analyzes customer data for product-market fit' },
    { id: 'james', name: 'James', role: 'Chief Talent Officer', version: '1.0.0', weight: 1.5, targetAccuracy: 0.75, description: 'Evaluates team capability and execution risk' },
    { id: 'rachel', name: 'Rachel', role: 'Chief Risk & Compliance Officer', version: '1.0.0', weight: 0.8, targetAccuracy: 0.90, description: 'Identifies legal and compliance risks' },
    { id: 'omar', name: 'Omar', role: 'Chief Technology Officer', version: '1.0.0', weight: 1.0, targetAccuracy: 0.75, description: 'Assesses technical feasibility and timelines' },
    { id: 'nora', name: 'Nora', role: 'Chief Funding & Comparables Officer', version: '1.0.0', weight: 0.8, targetAccuracy: 0.70, description: 'Maps funding landscape and comparable companies' },
    { id: 'victor', name: 'Victor', role: 'Chief Valuation Officer', version: '1.0.0', weight: 1.0, targetAccuracy: 0.75, description: 'Provides data-driven valuation analysis' },
    { id: 'victoria', name: 'Victoria', role: 'Chief Strategic Synthesizer', version: '1.0.0', weight: 0, targetAccuracy: 0.85, description: 'Synthesizes all reports into final verdict' },
    { id: 'sentinel', name: 'Sentinel', role: 'Chief Trust & Audit Officer', version: '1.0.0', weight: 0, targetAccuracy: 0, description: 'Ensures platform integrity and accuracy' },
  ];

  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return {
      agents: this.agents,
      count: this.agents.length,
    };
  }

  findOne(id: string) {
    const agent = this.agents.find(a => a.id === id);
    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    return agent;
  }

  async getAccuracy(id: string) {
    const agent = this.findOne(id);

    // Get accuracy metrics from database
    const metrics = await this.prisma.agentAccuracy.findMany({
      where: { agentId: id },
      orderBy: { calculatedAt: 'desc' },
      take: 10,
    });

    const latestMetric = metrics[0];

    return {
      agentId: id,
      agentName: agent.name,
      targetAccuracy: agent.targetAccuracy,
      currentAccuracy: latestMetric?.metricValue ?? null,
      sampleSize: latestMetric?.sampleSize ?? 0,
      meetsTarget: latestMetric ? latestMetric.metricValue >= agent.targetAccuracy : null,
      history: metrics,
      lastCalculated: latestMetric?.calculatedAt ?? null,
    };
  }
}
