# Validation Council - Investor-Grade Standards

## Overview

This document defines the standards that make our validation reports **investor-grade** - meaning they meet the quality and rigor that professional investors expect when evaluating startup opportunities.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2026-01-07 | Initial investor-grade standards |

---

## Core Principles

### 1. Every Claim Must Have a Source
- No unsubstantiated claims
- External sources preferred over internal estimates
- Clear indication when data is estimated vs. verified

### 2. Confidence Ranges, Not Point Estimates
- Always provide Low / Mid / High ranges
- Include confidence percentage (0-100%)
- Show variance methodology

### 3. Scenario Analysis
- Bull Case (optimistic) with probability
- Base Case (expected) with probability
- Bear Case (pessimistic) with probability
- Probability-weighted expected values

### 4. Validation Scorecard
Every report includes a quality scorecard graded A-F:
- Data Quality (5 points)
- Source Verification (5 points)
- Analysis Depth (5 points)
- Risk Assessment (5 points)
- Actionability (5 points)
- **Total: 25 points**

---

## Agent-Specific Standards

### Marcus (Market Intelligence) v3.0
- TAM/SAM/SOM with confidence ranges
- Real market data from Serper API
- Comparable company analysis
- Market dynamics & moat analysis
- Investment thesis builder

### Sophia (Competition) v3.0
- Competitive landscape matrix
- Porter's Five Forces analysis
- Competitor funding & valuation data
- Differentiation scoring
- Market positioning map

### David (Financial) v3.0
- Unit economics with ranges
- Financial projections (3-year)
- Burn rate & runway analysis
- Revenue model validation
- Profitability scenarios

### James (Team) v3.0
- Founder-market fit scoring
- Team completeness assessment
- Experience verification
- Advisory board evaluation
- Execution capability score

### Rachel (Legal/Risk) v3.0
- Regulatory risk matrix
- IP assessment
- Compliance checklist
- Legal structure evaluation
- Risk mitigation roadmap

### Omar (Technology) v3.0
- Tech stack assessment
- Scalability analysis
- Security evaluation
- Technical debt assessment
- Build vs. buy analysis

### Nora (Funding) v3.0
- Funding readiness score
- Investor fit analysis
- Valuation benchmarking
- Term sheet considerations
- Funding timeline

### Victor (Valuation) v3.0
- Multiple valuation methods
- Comparable transactions
- DCF analysis
- Risk-adjusted valuation
- Sensitivity analysis

---

## Report Structure

Every investor-grade report follows this structure:

```markdown
# Agent Name - INVESTOR-GRADE Report
## Version X.0 | Date

---

## VALIDATION SCORECARD
[Quality metrics table]

---

## EXECUTIVE SUMMARY
[2-3 paragraph summary]

---

## KEY FINDINGS
[Categorized findings with confidence scores]

---

## SCENARIO ANALYSIS
### Bull Case (X% probability)
### Base Case (X% probability)
### Bear Case (X% probability)

---

## RISK MATRIX
[Structured risk table]

---

## RECOMMENDATIONS
[Prioritized, actionable recommendations]

---

## VERIFIED DATA SOURCES
[All sources with URLs and confidence]

---

**Disclaimer**
[Standard investment disclaimer]
```

---

## Quality Checklist

Before any report is finalized, verify:

- [ ] All numerical claims have sources
- [ ] Confidence ranges provided for estimates
- [ ] Scenario analysis complete
- [ ] Validation scorecard calculated
- [ ] At least 3 external sources cited
- [ ] Risk matrix populated
- [ ] Recommendations are actionable
- [ ] Data freshness < 6 months
- [ ] Disclaimer included

---

## Technical Implementation

### Shared Types
Location: `apps/api/src/agents/shared/investor-grade.types.ts`

### Key Interfaces
- `ValidationScorecard` - Quality metrics
- `ScenarioAnalysis` - Bull/Base/Bear
- `ConfidenceRange` - Low/Mid/High estimates
- `RiskMatrixEntry` - Risk tracking
- `VerifiedSource` - Source verification

### Helper Functions
- `calculateGrade(score, maxScore)` - Letter grade
- `formatCurrency(value)` - $1.5B format

---

## Testing Requirements

Each agent upgrade must pass:
1. TypeScript compilation (`npx tsc --noEmit`)
2. Unit tests (if available)
3. Integration test with sample input
4. Report structure validation

---

## Maintenance

When updating agents:
1. Update version number
2. Update this documentation
3. Add changelog entry
4. Test with sample validation
5. Verify scorecard calculation

---

*Last Updated: 2026-01-07*
*Maintained by: Validation Council Team*
