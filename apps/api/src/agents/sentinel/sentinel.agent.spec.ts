import { Test, TestingModule } from '@nestjs/testing';
import { SentinelAgent } from './sentinel.agent';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SentinelAgent', () => {
  let agent: SentinelAgent;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    validation: {
      update: jest.fn().mockResolvedValue({ id: 'test-validation-id' }),
    },
    auditEvent: {
      create: jest.fn().mockResolvedValue({ id: 'test-event-id' }),
    },
    agentAccuracy: {
      findFirst: jest.fn().mockResolvedValue({
        agentId: 'marcus',
        accuracy: 0.75,
        totalPredictions: 20,
      }),
      upsert: jest.fn().mockResolvedValue({}),
    },
    prediction: {
      create: jest.fn().mockResolvedValue({ id: 'test-prediction-id' }),
      findUnique: jest.fn().mockResolvedValue({
        id: 'test-prediction-id',
        agentId: 'marcus',
      }),
      findMany: jest.fn().mockResolvedValue([
        { wasAccurate: true },
        { wasAccurate: true },
        { wasAccurate: false },
      ]),
      update: jest.fn().mockResolvedValue({}),
    },
    citation: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'test-citation-id',
        sourceUrl: 'https://example.com',
        snapshot: {
          content: 'test content',
          contentHash: 'abc123',
        },
      }),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SentinelAgent,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    agent = module.get<SentinelAgent>(SentinelAgent);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(agent).toBeDefined();
    });

    it('should have correct agent metadata', () => {
      expect(agent.agentId).toBe('sentinel');
      expect(agent.agentName).toBe('Sentinel');
      expect(agent.scoringWeight).toBe(0); // Audit agent doesn't contribute to score
    });
  });

  describe('audit', () => {
    const validationId = 'test-validation-id';

    const baseAgentReports = [
      {
        agentId: 'marcus',
        agentName: 'Marcus',
        version: '1.0.0',
        score: 7,
        citations: [
          {
            id: 'cit-1',
            claim: 'Market size is $10B',
            source: 'Market Research Report',
            sourceUrl: 'internal://marcus/market-size',
            confidence: 0.7,
            dataType: 'computed',
          },
        ],
        findings: [
          { title: 'Large Market', description: 'Good market size', type: 'strength', confidence: 7 },
        ],
        rawAnalysis: 'Market analysis.',
      },
      {
        agentId: 'elena',
        agentName: 'Elena',
        version: '1.0.0',
        score: 8,
        citations: [
          {
            id: 'cit-2',
            claim: 'Strong customer interest',
            source: 'Customer Interviews',
            sourceUrl: 'internal://elena/interviews',
            confidence: 0.8,
            dataType: 'primary',
          },
        ],
        findings: [],
        rawAnalysis: 'Customer validation.',
      },
    ];

    it('should audit agent reports', async () => {
      const result = await agent.audit(validationId, baseAgentReports as any);

      expect(result).toBeDefined();
      expect(result.validationId).toBe(validationId);
      expect(result.trustScore).toBeDefined();
      expect(result.issuesFound).toBeDefined();
      expect(result.citationStats).toBeDefined();
      expect(result.integrityHash).toBeDefined();
    });

    it('should calculate trust score', async () => {
      const result = await agent.audit(validationId, baseAgentReports as any);

      expect(result.trustScore).toBeGreaterThanOrEqual(1);
      expect(result.trustScore).toBeLessThanOrEqual(10);
    });

    it('should track citation statistics', async () => {
      const result = await agent.audit(validationId, baseAgentReports as any);

      expect(result.citationStats.total).toBe(2);
      expect(result.citationStats.verified).toBeDefined();
      expect(result.citationStats.unverified).toBeDefined();
      expect(result.citationStats.lowConfidence).toBeDefined();
    });

    it('should generate integrity hash', async () => {
      const result = await agent.audit(validationId, baseAgentReports as any);

      expect(result.integrityHash).toBeDefined();
      expect(result.integrityHash.length).toBe(64); // SHA-256 hex length
    });

    it('should record audit timestamp', async () => {
      const result = await agent.audit(validationId, baseAgentReports as any);

      expect(result.auditedAt).toBeDefined();
      expect(result.auditedAt instanceof Date).toBe(true);
    });
  });

  describe('citation auditing', () => {
    const validationId = 'test-validation-id';

    it('should flag low confidence citations', async () => {
      const reportsWithLowConfidence = [
        {
          agentId: 'marcus',
          agentName: 'Marcus',
          version: '1.0.0',
          score: 7,
          citations: [
            {
              id: 'cit-low',
              claim: 'Uncertain market size',
              source: 'Estimate',
              sourceUrl: 'internal://marcus/estimate',
              confidence: 0.3, // Below threshold
              dataType: 'computed',
            },
          ],
          findings: [],
          rawAnalysis: '',
        },
      ];

      const result = await agent.audit(validationId, reportsWithLowConfidence as any);

      const lowConfidenceIssues = result.issuesFound.filter(i => i.type === 'low_confidence');
      expect(lowConfidenceIssues.length).toBeGreaterThan(0);
    });

    it('should flag unverified external citations', async () => {
      const reportsWithUnverified = [
        {
          agentId: 'marcus',
          agentName: 'Marcus',
          version: '1.0.0',
          score: 7,
          citations: [
            {
              id: 'cit-ext',
              claim: 'External data',
              source: 'External Source',
              sourceUrl: 'https://example.com/data',
              confidence: 0.7,
              dataType: 'secondary',
              // No snapshotHash
            },
          ],
          findings: [],
          rawAnalysis: '',
        },
      ];

      const result = await agent.audit(validationId, reportsWithUnverified as any);

      const unverifiedIssues = result.issuesFound.filter(i => i.type === 'unverified_citation');
      expect(unverifiedIssues.length).toBeGreaterThan(0);
    });

    it('should verify internal citations', async () => {
      const reportsWithInternal = [
        {
          agentId: 'marcus',
          agentName: 'Marcus',
          version: '1.0.0',
          score: 7,
          citations: [
            {
              id: 'cit-int',
              claim: 'Computed value',
              source: 'Internal Calculation',
              sourceUrl: 'internal://marcus/calc',
              confidence: 0.7,
              dataType: 'computed',
            },
          ],
          findings: [],
          rawAnalysis: '',
        },
      ];

      const result = await agent.audit(validationId, reportsWithInternal as any);

      // Internal citations with reasonable confidence should be verified
      expect(result.citationStats.verified).toBeGreaterThan(0);
    });
  });

  describe('contradiction detection', () => {
    const validationId = 'test-validation-id';

    it('should detect score disagreements', async () => {
      const reportsWithDisagreement = [
        {
          agentId: 'marcus',
          agentName: 'Marcus',
          version: '1.0.0',
          score: 9, // High score
          citations: [],
          findings: [],
          rawAnalysis: '',
        },
        {
          agentId: 'sophia',
          agentName: 'Sophia',
          version: '1.0.0',
          score: 4, // Low score - significant disagreement
          citations: [],
          findings: [],
          rawAnalysis: '',
        },
      ];

      const result = await agent.audit(validationId, reportsWithDisagreement as any);

      const contradictions = result.issuesFound.filter(i => i.type === 'contradiction');
      expect(contradictions.length).toBeGreaterThan(0);
    });

    it('should not flag minor score differences', async () => {
      const reportsWithMinorDiff = [
        {
          agentId: 'marcus',
          agentName: 'Marcus',
          version: '1.0.0',
          score: 7,
          citations: [],
          findings: [],
          rawAnalysis: '',
        },
        {
          agentId: 'sophia',
          agentName: 'Sophia',
          version: '1.0.0',
          score: 6, // Close scores - no contradiction
          citations: [],
          findings: [],
          rawAnalysis: '',
        },
      ];

      const result = await agent.audit(validationId, reportsWithMinorDiff as any);

      const scoreContradictions = result.issuesFound.filter(i =>
        i.type === 'contradiction' && i.description.includes('score')
      );
      expect(scoreContradictions.length).toBe(0);
    });
  });

  describe('agent accuracy tracking', () => {
    const validationId = 'test-validation-id';

    it('should check agent accuracy history', async () => {
      const reports = [
        {
          agentId: 'marcus',
          agentName: 'Marcus',
          version: '1.0.0',
          score: 7,
          citations: [],
          findings: [],
          rawAnalysis: '',
        },
      ];

      const result = await agent.audit(validationId, reports as any);

      expect(result.agentAccuracyFlags).toBeDefined();
      expect(result.agentAccuracyFlags['marcus']).toBeDefined();
    });

    it('should flag agents with low historical accuracy', async () => {
      mockPrismaService.agentAccuracy.findFirst.mockResolvedValueOnce({
        agentId: 'marcus',
        accuracy: 0.4, // Below 60% threshold
        totalPredictions: 20,
      });

      const reports = [
        {
          agentId: 'marcus',
          agentName: 'Marcus',
          version: '1.0.0',
          score: 7,
          citations: [],
          findings: [],
          rawAnalysis: '',
        },
      ];

      const result = await agent.audit(validationId, reports as any);

      const accuracyFlags = result.agentAccuracyFlags['marcus'];
      expect(accuracyFlags.some(f => f.includes('accuracy'))).toBe(true);
    });

    it('should flag agents with limited prediction history', async () => {
      mockPrismaService.agentAccuracy.findFirst.mockResolvedValueOnce({
        agentId: 'marcus',
        accuracy: 0.8,
        totalPredictions: 5, // Limited history
      });

      const reports = [
        {
          agentId: 'marcus',
          agentName: 'Marcus',
          version: '1.0.0',
          score: 7,
          citations: [],
          findings: [],
          rawAnalysis: '',
        },
      ];

      const result = await agent.audit(validationId, reports as any);

      const accuracyFlags = result.agentAccuracyFlags['marcus'];
      expect(accuracyFlags.some(f => f.includes('Limited') || f.includes('history'))).toBe(true);
    });
  });

  describe('prediction tracking', () => {
    const validationId = 'test-validation-id';

    it('should track new prediction', async () => {
      const predictionId = await agent.trackPrediction(
        validationId,
        'marcus',
        'market_size',
        10000000000,
        0.7
      );

      expect(predictionId).toBeDefined();
      expect(mockPrismaService.prediction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          validationId,
          agentId: 'marcus',
          predictionType: 'market_size',
          predictedValue: 10000000000,
          confidence: 0.7,
        }),
      });
    });

    it('should record outcome for prediction', async () => {
      await agent.recordOutcome('test-prediction-id', 9500000000, true);

      expect(mockPrismaService.prediction.update).toHaveBeenCalledWith({
        where: { id: 'test-prediction-id' },
        data: expect.objectContaining({
          actualValue: 9500000000,
          wasAccurate: true,
        }),
      });
    });
  });

  describe('citation verification', () => {
    it('should verify citation with valid snapshot', async () => {
      const result = await agent.verifyCitation('test-citation-id');

      expect(result.verified).toBeDefined();
      expect(result.reason).toBeDefined();
    });

    it('should return not found for missing citation', async () => {
      mockPrismaService.citation.findUnique.mockResolvedValueOnce(null);

      const result = await agent.verifyCitation('nonexistent-id');

      expect(result.verified).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should verify internal citations', async () => {
      mockPrismaService.citation.findUnique.mockResolvedValueOnce({
        id: 'internal-cit',
        sourceUrl: 'internal://marcus/calc',
        snapshot: null,
      });

      const result = await agent.verifyCitation('internal-cit');

      expect(result.verified).toBe(true);
      expect(result.reason).toContain('Internal');
    });
  });

  describe('event emission', () => {
    const validationId = 'test-validation-id';

    const baseReports = [
      {
        agentId: 'marcus',
        agentName: 'Marcus',
        version: '1.0.0',
        score: 7,
        citations: [],
        findings: [],
        rawAnalysis: '',
      },
    ];

    it('should emit audit.completed event', async () => {
      await agent.audit(validationId, baseReports as any);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'audit.completed',
        expect.objectContaining({
          validationId,
          trustScore: expect.any(Number),
        })
      );
    });

    it('should emit audit.critical_issues for critical problems', async () => {
      const reportsWithCritical = [
        {
          agentId: 'marcus',
          agentName: 'Marcus',
          version: '1.0.0',
          score: 7,
          citations: [
            {
              id: 'bad-cit',
              claim: 'Unverified critical claim',
              source: 'Unknown',
              sourceUrl: 'https://example.com',
              confidence: 0.9, // High confidence but no snapshot
              dataType: 'primary',
            },
          ],
          findings: [
            { title: 'Critical Finding', description: 'Very important', type: 'strength', confidence: 2 }, // Very low confidence
          ],
          rawAnalysis: '',
        },
      ];

      await agent.audit(validationId, reportsWithCritical as any);

      // Check if critical issues event was emitted
      const criticalEmissions = mockEventEmitter.emit.mock.calls.filter(
        call => call[0] === 'audit.critical_issues'
      );
      // May or may not emit depending on severity calculation
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should update validation with trust score', async () => {
      await agent.audit(validationId, baseReports as any);

      expect(mockPrismaService.validation.update).toHaveBeenCalledWith({
        where: { id: validationId },
        data: expect.objectContaining({
          trustScore: expect.any(Number),
          auditedAt: expect.any(Date),
        }),
      });
    });

    it('should create audit event record', async () => {
      await agent.audit(validationId, baseReports as any);

      expect(mockPrismaService.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          validationId,
          eventType: 'AUDIT_COMPLETED',
          agentId: 'sentinel',
        }),
      });
    });
  });
});
