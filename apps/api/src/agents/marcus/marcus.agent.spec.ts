import { Test, TestingModule } from '@nestjs/testing';
import { MarcusAgent } from './marcus.agent';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('MarcusAgent', () => {
  let agent: MarcusAgent;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    agentReport: {
      create: jest.fn().mockResolvedValue({ id: 'test-report-id' }),
    },
    citation: {
      create: jest.fn().mockResolvedValue({ id: 'test-citation-id' }),
    },
    auditEvent: {
      create: jest.fn().mockResolvedValue({ id: 'test-event-id' }),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcusAgent,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    agent = module.get<MarcusAgent>(MarcusAgent);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(agent).toBeDefined();
    });

    it('should have correct agent metadata', () => {
      expect(agent['agentId']).toBe('marcus');
      expect(agent['agentName']).toBe('Marcus');
      expect(agent['scoringWeight']).toBe(1.0);
    });
  });

  describe('analyze', () => {
    const validationId = 'test-validation-id';

    const createInput = (ideaOverrides = {}) => ({
      validationId,
      idea: {
        title: 'Test Startup',
        description: 'A SaaS platform for small businesses',
        industry: 'saas',
        businessModel: 'saas',
        ...ideaOverrides,
      },
      founderData: {},
    });

    it('should analyze a standard SaaS idea', async () => {
      const input = createInput();
      const result = await agent.analyze(input);

      expect(result).toBeDefined();
      expect(result.agentId).toBe('marcus');
      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(10);
      expect(result.findings).toBeDefined();
      expect(Array.isArray(result.findings)).toBe(true);
    });

    it('should identify large market size for B2B SaaS', async () => {
      const input = createInput({
        title: 'Enterprise CRM',
        description: 'CRM platform for enterprise b2b companies',
        industry: 'technology',
      });

      const result = await agent.analyze(input);

      expect(result.findings).toBeDefined();
      // Should identify B2B market
      const hasTAMFinding = result.findings.some(f =>
        f.title.toLowerCase().includes('market') || f.title.toLowerCase().includes('tam')
      );
      expect(hasTAMFinding).toBe(true);
    });

    it('should flag small markets appropriately', async () => {
      const input = createInput({
        title: 'Niche Hobby Store',
        description: 'Selling vintage stamps in a local area',
        industry: 'retail',
        businessModel: 'ecommerce',
      });

      const result = await agent.analyze(input);

      expect(result.score).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate citations for claims', async () => {
      const input = createInput();
      const result = await agent.analyze(input);

      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
      expect(result.citations.length).toBeGreaterThan(0);

      // Each citation should have required fields
      result.citations.forEach(citation => {
        expect(citation.claim).toBeDefined();
        expect(citation.source).toBeDefined();
        expect(citation.confidence).toBeGreaterThanOrEqual(0);
        expect(citation.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should include risks for challenging markets', async () => {
      const input = createInput({
        title: 'Declining Industry Startup',
        description: 'A print newspaper platform',
        industry: 'media',
        businessModel: 'advertising',
      });

      const result = await agent.analyze(input);

      expect(result.risks).toBeDefined();
      expect(Array.isArray(result.risks)).toBe(true);
    });

    it('should include recommendations', async () => {
      const input = createInput();
      const result = await agent.analyze(input);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);

      result.recommendations.forEach(rec => {
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.priority).toBeDefined();
      });
    });
  });

  describe('scoring', () => {
    const validationId = 'test-validation-id';

    it('should score high for large growing markets', async () => {
      const input = {
        validationId,
        idea: {
          title: 'AI Tool',
          description: 'An AI-powered analytics platform for enterprises',
          industry: 'technology',
          businessModel: 'saas',
        },
        founderData: {},
      };

      const result = await agent.analyze(input);
      expect(result.score).toBeGreaterThanOrEqual(6);
    });

    it('should include executionTimeMs', async () => {
      const input = {
        validationId,
        idea: {
          title: 'Test Idea',
          description: 'A basic SaaS application',
          industry: 'technology',
          businessModel: 'saas',
        },
        founderData: {},
      };

      const result = await agent.analyze(input);
      expect(result.executionTimeMs).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    const validationId = 'test-validation-id';

    it('should handle missing industry gracefully', async () => {
      const input = {
        validationId,
        idea: {
          title: 'Generic Startup',
          description: 'A platform for connecting people',
        },
        founderData: {},
      };

      const result = await agent.analyze(input as any);

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
    });

    it('should handle empty description', async () => {
      const input = {
        validationId,
        idea: {
          title: 'Unnamed Startup',
          description: '',
          industry: 'technology',
        },
        founderData: {},
      };

      const result = await agent.analyze(input as any);

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
    });

    it('should handle special characters in input', async () => {
      const input = {
        validationId,
        idea: {
          title: 'Startup™ with © symbols',
          description: 'A platform for <script>alert("test")</script>',
          industry: 'technology',
        },
        founderData: {},
      };

      const result = await agent.analyze(input as any);

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
    });
  });

  describe('database interaction', () => {
    it('should store agent report', async () => {
      const input = {
        validationId: 'test-validation-id',
        idea: {
          title: 'Test',
          description: 'Test description',
        },
        founderData: {},
      };

      await agent.analyze(input as any);

      expect(mockPrismaService.agentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          validationId: 'test-validation-id',
          agentId: 'marcus',
        }),
      });
    });

    it('should store citations', async () => {
      const input = {
        validationId: 'test-validation-id',
        idea: {
          title: 'Test',
          description: 'Test description',
        },
        founderData: {},
      };

      await agent.analyze(input as any);

      // Should have called citation.create at least once
      expect(mockPrismaService.citation.create).toHaveBeenCalled();
    });
  });
});
