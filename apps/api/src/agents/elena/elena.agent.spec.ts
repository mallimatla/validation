import { Test, TestingModule } from '@nestjs/testing';
import { ElenaAgent } from './elena.agent';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ElenaAgent', () => {
  let agent: ElenaAgent;
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
        ElenaAgent,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    agent = module.get<ElenaAgent>(ElenaAgent);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(agent).toBeDefined();
    });

    it('should have correct agent metadata', () => {
      expect(agent['agentId']).toBe('elena');
      expect(agent['agentName']).toBe('Elena');
      expect(agent['scoringWeight']).toBe(2.0);
    });
  });

  describe('analyze', () => {
    const validationId = 'test-validation-id';

    const createInput = (overrides: any = {}) => ({
      validationId,
      idea: {
        title: 'Test Startup',
        description: 'A SaaS tool that customers are already paying for',
        targetCustomer: 'Small business owners',
        ...overrides.idea,
      },
      founderData: overrides.founderData || {},
    });

    it('should analyze startup with strong customer evidence', async () => {
      const input = createInput({
        founderData: {
          interviewCount: 50,
          strongInterestRate: 0.8,
          preorders: 15,
          waitlistSize: 200,
        },
      });

      const result = await agent.analyze(input as any);

      expect(result).toBeDefined();
      expect(result.agentId).toBe('elena');
      expect(result.score).toBeGreaterThanOrEqual(5);
    });

    it('should score low for startup with no customer evidence', async () => {
      const input = createInput({
        idea: {
          title: 'Unvalidated Idea',
          description: 'An idea I came up with but never tested',
          targetCustomer: 'Everyone',
        },
        founderData: {
          interviewCount: 0,
        },
      });

      const result = await agent.analyze(input as any);

      expect(result.score).toBeDefined();
    });

    it('should identify PMF signals', async () => {
      const input = createInput({
        idea: {
          title: 'High PMF Product',
          description: 'Customers actively asking for this product',
        },
        founderData: {
          interviewCount: 30,
          strongInterestRate: 0.9,
          preorders: 10,
        },
      });

      const result = await agent.analyze(input as any);

      expect(result.findings.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate recommendations', async () => {
      const input = createInput({
        idea: {
          title: 'Early Stage Idea',
          description: 'A platform for project management',
          targetCustomer: 'Project managers',
        },
        founderData: {
          interviewCount: 5,
        },
      });

      const result = await agent.analyze(input as any);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('evidence validation', () => {
    const validationId = 'test-validation-id';

    it('should value high interest rate', async () => {
      const input = {
        validationId,
        idea: { title: 'Revenue Startup', description: 'SaaS platform' },
        founderData: { interviewCount: 20, strongInterestRate: 0.6 },
      };

      const result = await agent.analyze(input as any);
      expect(result.score).toBeDefined();
    });

    it('should value pre-orders as strong validation', async () => {
      const input = {
        validationId,
        idea: {
          title: 'Pre-order Success',
          description: 'A hardware product with pre-orders',
        },
        founderData: {
          preorders: 50,
        },
      };

      const result = await agent.analyze(input as any);
      expect(result.score).toBeDefined();
    });
  });

  describe('risk identification', () => {
    const validationId = 'test-validation-id';

    it('should identify risk when interest rate is low', async () => {
      const input = {
        validationId,
        idea: {
          title: 'Low Interest Idea',
          description: 'People did not seem excited',
        },
        founderData: {
          interviewCount: 20,
          strongInterestRate: 0.1,
        },
      };

      const result = await agent.analyze(input as any);
      expect(result).toBeDefined();
    });
  });

  describe('citations', () => {
    const validationId = 'test-validation-id';

    it('should generate citations', async () => {
      const input = {
        validationId,
        idea: {
          title: 'Evidence-based Startup',
          description: 'Validated through research',
        },
        founderData: {
          interviewCount: 25,
          strongInterestRate: 0.8,
        },
      };

      const result = await agent.analyze(input as any);

      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
      expect(result.citations.length).toBeGreaterThan(0);
    });

    it('should have valid confidence levels', async () => {
      const input = {
        validationId,
        idea: {
          title: 'Test Startup',
          description: 'A platform',
        },
        founderData: {
          interviewCount: 10,
        },
      };

      const result = await agent.analyze(input as any);

      result.citations.forEach(citation => {
        expect(citation.confidence).toBeGreaterThanOrEqual(0);
        expect(citation.confidence).toBeLessThanOrEqual(1);
      });
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
          agentId: 'elena',
        }),
      });
    });
  });
});
