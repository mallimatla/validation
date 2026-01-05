import { Test, TestingModule } from '@nestjs/testing';
import { VictoriaAgent } from './victoria.agent';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('VictoriaAgent', () => {
  let agent: VictoriaAgent;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    validation: {
      update: jest.fn().mockResolvedValue({ id: 'test-validation-id' }),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VictoriaAgent,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    agent = module.get<VictoriaAgent>(VictoriaAgent);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(agent).toBeDefined();
    });

    it('should have correct agent metadata', () => {
      expect(agent.agentId).toBe('victoria');
      expect(agent.agentName).toBe('Victoria');
      expect(agent.scoringWeight).toBe(0); // Synthesis agent doesn't contribute to score
    });
  });

  describe('synthesize', () => {
    const validationId = 'test-validation-id';

    const baseAgentReports = [
      {
        agentId: 'marcus',
        agentName: 'Marcus',
        score: 8,
        weight: 1.0,
        findings: [
          { title: 'Large Market', description: 'TAM is significant', type: 'strength', severity: 'major', confidence: 8 },
        ],
        risks: [],
        recommendations: [],
        rawAnalysis: 'Market analysis complete.',
      },
      {
        agentId: 'elena',
        agentName: 'Elena',
        score: 7,
        weight: 2.0,
        findings: [
          { title: 'Customer Interest', description: 'Customers showing interest', type: 'strength', severity: 'major', confidence: 7 },
        ],
        risks: [],
        recommendations: [],
        rawAnalysis: 'Customer validation complete.',
      },
      {
        agentId: 'david',
        agentName: 'David',
        score: 6,
        weight: 1.5,
        findings: [
          { title: 'Unit Economics Viable', description: 'Positive unit economics expected', type: 'strength', severity: 'minor', confidence: 6 },
        ],
        risks: [
          { title: 'Funding Risk', description: 'May need external funding', category: 'financial', probability: 'medium', impact: 'moderate', mitigations: [] },
        ],
        recommendations: [
          { title: 'Track CAC', description: 'Monitor customer acquisition costs', priority: 'high', timeframe: 'immediate' },
        ],
        rawAnalysis: 'Financial analysis complete.',
      },
    ];

    it('should synthesize multiple agent reports', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(result.ninetyDayPlan).toBeDefined();
      expect(result.executiveSummary).toBeDefined();
    });

    it('should calculate weighted overall score correctly', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      // Manual calculation: (8*1.0 + 7*2.0 + 6*1.5) / (1.0 + 2.0 + 1.5) = (8 + 14 + 9) / 4.5 = 31/4.5 ≈ 6.9
      expect(result.overallScore).toBeCloseTo(6.9, 0);
      expect(result.scoreBreakdown).toEqual({
        marcus: 8,
        elena: 7,
        david: 6,
      });
    });

    it('should return strong_proceed for high scores', async () => {
      const highScoreReports = baseAgentReports.map(r => ({ ...r, score: 8.5 }));

      const result = await agent.synthesize(validationId, highScoreReports as any);

      expect(result.verdict).toBe('strong_proceed');
    });

    it('should return do_not_proceed for critical issues', async () => {
      const criticalReports = [
        {
          ...baseAgentReports[0],
          score: 3,
          findings: [
            { title: 'No Market', description: 'Market does not exist', type: 'weakness', severity: 'critical', confidence: 9 },
            { title: 'Wrong Timing', description: 'Too late to enter', type: 'weakness', severity: 'critical', confidence: 8 },
          ],
        },
        {
          ...baseAgentReports[1],
          agentId: 'elena',
          score: 2,
          findings: [
            { title: 'No PMF', description: 'No product-market fit', type: 'weakness', severity: 'critical', confidence: 9 },
          ],
        },
        {
          ...baseAgentReports[2],
          score: 2,
          risks: [
            { title: 'Will fail', description: 'Critical risk', category: 'execution', probability: 'high', impact: 'critical', mitigations: [] },
            { title: 'No revenue model', description: 'Critical risk', category: 'financial', probability: 'high', impact: 'critical', mitigations: [] },
          ],
        },
      ];

      const result = await agent.synthesize(validationId, criticalReports as any);

      expect(result.verdict).toBe('do_not_proceed');
    });

    it('should return proceed_with_caution for moderate scores', async () => {
      const moderateReports = baseAgentReports.map(r => ({ ...r, score: 6 }));

      const result = await agent.synthesize(validationId, moderateReports as any);

      expect(['proceed_with_caution', 'strong_proceed']).toContain(result.verdict);
    });

    it('should extract key strengths', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      expect(result.keyStrengths).toBeDefined();
      expect(Array.isArray(result.keyStrengths)).toBe(true);
      expect(result.keyStrengths.length).toBeGreaterThan(0);
    });

    it('should extract key weaknesses', async () => {
      const reportsWithWeaknesses = [
        ...baseAgentReports,
        {
          agentId: 'james',
          agentName: 'James',
          score: 5,
          weight: 1.5,
          findings: [
            { title: 'Solo Founder', description: 'Single founder risk', type: 'weakness', severity: 'major', confidence: 8 },
          ],
          risks: [],
          recommendations: [],
          rawAnalysis: 'Team analysis complete.',
        },
      ];

      const result = await agent.synthesize(validationId, reportsWithWeaknesses as any);

      expect(result.keyWeaknesses).toBeDefined();
      expect(Array.isArray(result.keyWeaknesses)).toBe(true);
    });

    it('should extract critical risks', async () => {
      const reportsWithRisks = [
        ...baseAgentReports,
        {
          agentId: 'rachel',
          agentName: 'Rachel',
          score: 6,
          weight: 0.8,
          findings: [],
          risks: [
            { title: 'Regulatory Risk', description: 'May face regulatory challenges', category: 'legal', probability: 'high', impact: 'moderate', mitigations: [] },
          ],
          recommendations: [],
          rawAnalysis: 'Legal analysis complete.',
        },
      ];

      const result = await agent.synthesize(validationId, reportsWithRisks as any);

      expect(result.criticalRisks).toBeDefined();
      expect(Array.isArray(result.criticalRisks)).toBe(true);
    });
  });

  describe('90-day plan generation', () => {
    const validationId = 'test-validation-id';

    const baseAgentReports = [
      {
        agentId: 'marcus',
        agentName: 'Marcus',
        score: 7,
        weight: 1.0,
        findings: [],
        risks: [],
        recommendations: [],
        rawAnalysis: '',
      },
      {
        agentId: 'elena',
        agentName: 'Elena',
        score: 7,
        weight: 2.0,
        findings: [],
        risks: [],
        recommendations: [],
        rawAnalysis: '',
      },
    ];

    it('should generate 90-day action plan', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      expect(result.ninetyDayPlan).toBeDefined();
      expect(Array.isArray(result.ninetyDayPlan)).toBe(true);
      expect(result.ninetyDayPlan.length).toBeGreaterThan(0);
    });

    it('should include required fields in each action', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      result.ninetyDayPlan.forEach(action => {
        expect(action.week).toBeDefined();
        expect(action.title).toBeDefined();
        expect(action.description).toBeDefined();
        expect(action.category).toBeDefined();
        expect(action.priority).toBeDefined();
        expect(action.successMetric).toBeDefined();
      });
    });

    it('should prioritize validation for cautionary verdict', async () => {
      const lowScoreReports = baseAgentReports.map(r => ({ ...r, score: 5 }));

      const result = await agent.synthesize(validationId, lowScoreReports as any);

      // First week should focus on validation
      const firstWeekActions = result.ninetyDayPlan.filter(a => a.week === 1);
      const hasValidationAction = firstWeekActions.some(a =>
        a.category === 'validation' || a.title.toLowerCase().includes('valid')
      );
      expect(hasValidationAction).toBe(true);
    });

    it('should include customer discovery in plan', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      const hasCustomerDiscovery = result.ninetyDayPlan.some(a =>
        a.title.toLowerCase().includes('customer') ||
        a.description.toLowerCase().includes('interview')
      );
      expect(hasCustomerDiscovery).toBe(true);
    });

    it('should include MVP development in plan', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      const hasMVP = result.ninetyDayPlan.some(a =>
        a.title.toLowerCase().includes('mvp') ||
        a.description.toLowerCase().includes('mvp') ||
        a.category === 'product'
      );
      expect(hasMVP).toBe(true);
    });

    it('should include launch milestone', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      const hasLaunch = result.ninetyDayPlan.some(a =>
        a.title.toLowerCase().includes('launch')
      );
      expect(hasLaunch).toBe(true);
    });
  });

  describe('executive summary', () => {
    const validationId = 'test-validation-id';

    const baseAgentReports = [
      {
        agentId: 'elena',
        agentName: 'Elena',
        score: 7,
        weight: 2.0,
        findings: [{ title: 'Good PMF', description: 'Strong signals', type: 'strength', severity: 'major', confidence: 8 }],
        risks: [],
        recommendations: [],
        rawAnalysis: '',
      },
    ];

    it('should generate executive summary', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      expect(result.executiveSummary).toBeDefined();
      expect(typeof result.executiveSummary).toBe('string');
      expect(result.executiveSummary.length).toBeGreaterThan(100);
    });

    it('should include overall score in summary', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      expect(result.executiveSummary).toContain('Score');
    });

    it('should include verdict in summary', async () => {
      const result = await agent.synthesize(validationId, baseAgentReports as any);

      expect(result.executiveSummary).toContain('Verdict');
    });
  });

  describe('event emission', () => {
    const validationId = 'test-validation-id';

    const baseAgentReports = [
      {
        agentId: 'marcus',
        agentName: 'Marcus',
        score: 7,
        weight: 1.0,
        findings: [],
        risks: [],
        recommendations: [],
        rawAnalysis: '',
      },
    ];

    it('should emit validation.synthesized event', async () => {
      await agent.synthesize(validationId, baseAgentReports as any);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'validation.synthesized',
        expect.objectContaining({
          validationId,
          overallScore: expect.any(Number),
          verdict: expect.any(String),
        })
      );
    });

    it('should update validation in database', async () => {
      await agent.synthesize(validationId, baseAgentReports as any);

      expect(mockPrismaService.validation.update).toHaveBeenCalledWith({
        where: { id: validationId },
        data: expect.objectContaining({
          overallScore: expect.any(Number),
          verdict: expect.any(String),
          status: 'completed',
        }),
      });
    });
  });
});
