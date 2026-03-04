# EstiMate — Team Handover Document

AI-powered project estimation tool that generates detailed estimates from RFP documents or guided questionnaires, with practice library calibration and confidence scoring.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Anthropic Claude API · TypeScript

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
```

**Environment** (`.env.local`):
```
ANTHROPIC_API_KEY=sk-...
ANTHROPIC_BASE_URL=https://litellm.secondstack.t1a.io
```

---

## Architecture Overview

```
src/
├── app/
│   ├── page.tsx                  # Landing page (3 entry points)
│   ├── upload/page.tsx           # RFP upload flow
│   ├── questionnaire/page.tsx    # 6-step guided questionnaire
│   ├── results/page.tsx          # Full estimation display + actions
│   ├── practice/page.tsx         # Practice library management
│   └── api/
│       ├── estimate-rfp/         # POST - generate from uploaded document
│       ├── estimate-questions/   # POST - generate from questionnaire answers
│       └── refine-item/          # POST - refine or decompose a cost item
├── components/
│   ├── EstimationResults.tsx     # Master container for all result sections
│   ├── CostBreakdown.tsx         # Cost items grouped by phase, confidence controls, export
│   ├── ResourcePlan.tsx          # Weekly allocation heatmap, gap detection, compress/optimize
│   ├── PhaseTimeline.tsx         # Gantt-chart style phase visualization
│   ├── TeamComposition.tsx       # Team roles grid
│   ├── RiskAssessment.tsx        # Risks sorted by severity
│   ├── DeliverablesList.tsx      # Deliverables grouped by phase
│   ├── CustomComponentsList.tsx  # Special components with complexity
│   ├── AssumptionsLimitations.tsx # Two-column assumptions/limitations
│   ├── QuestionnaireForm.tsx     # Step-specific form renderer
│   ├── FileUploader.tsx          # Drag-and-drop upload
│   ├── LoadingEstimation.tsx     # Animated loading during AI generation
│   ├── StepIndicator.tsx         # Questionnaire progress indicator
│   ├── Header.tsx / Footer.tsx / Logo.tsx
│   └── ...
└── lib/
    ├── types.ts                  # All TypeScript interfaces
    ├── constants.ts              # Questionnaire config, rates, role labels
    ├── claude.ts                 # Anthropic SDK: generateEstimation, addConfidenceScores, refineItem
    ├── prompts.ts                # Prompt builders for all AI calls
    ├── parse-document.ts         # PDF/DOCX/TXT text extraction
    ├── parse-csv.ts              # CSV import with flexible column detection
    ├── export-cost.ts            # CSV/XLSX/image export for cost breakdown
    └── resource-plan.ts          # Weekly resource allocation, gap detection, timeline optimization
```

---

## Data Flow

```
User Input (RFP or Questionnaire)
  → API route calls Claude with structured prompt + practice calibration data
  → Claude returns Estimation JSON (phases, timeline, cost breakdown, team, risks, etc.)
  → Confidence scores added via agentic review loop
  → Stored in sessionStorage → rendered on /results

Results Page Actions:
  ├── Refine item     → POST /api/refine-item (action: "refine")
  ├── Decompose item  → POST /api/refine-item (action: "decompose")
  ├── Override confidence / mark confirmed → local state + sessionStorage
  ├── Save to Practice → localStorage + fullEstimation JSON snapshot
  ├── Export → CSV / XLSX / clipboard image / print
  └── Optimize Timeline → shifts phases to close idle gaps
```

---

## Storage

| What | Where | Key |
|------|-------|-----|
| Current estimation | `sessionStorage` | `"estimation"` |
| Practice library | `localStorage` | `"practice-estimations"` |
| Derived practice rates | `localStorage` | `"practice-rates"` |

No database — everything is browser-local.

---

## Key Features

### 1. Estimation Generation
- **Two paths:** Upload RFP document (PDF/DOCX/TXT) or answer 6-step questionnaire
- **Configurable rates:** CS, Dev, AR hourly rates + PM%, QA% overhead
- **Currency support:** USD, EUR, GBP, CHF, etc.
- **Start date support:** Optional calendar dates on timeline phases

### 2. Confidence Scoring & Refinement
- Claude assigns 0-100% confidence to each cost line item
- Agentic review loop (`addConfidenceScores`) cross-checks coherence
- Users can: override confidence manually, mark items confirmed, refine low-confidence items, decompose uncertain items into sub-tasks
- Three-point estimates: optimistic/expected/pessimistic hours

### 3. Cost Breakdown
- Items grouped by phase (Blueprint / Implementation / UAT & Go-Live)
- Role breakdown per item: CS, Dev, AR, PM, QA with hours, rate, cost
- Man-Day summary matrix (role × phase totals)
- Export to CSV, XLSX, or clipboard image

### 4. Resource Plan
- Week-by-week allocation grid (hours/day per role)
- Color-coded heatmap cells by intensity
- **Gap detection:** identifies idle periods between phases
- **Compress view:** hides empty weeks (visual only)
- **Optimize Timeline:** shifts phases earlier to close gaps (modifies estimation data)
- Export to CSV or Excel

### 5. Practice Library
- Store historical project data for AI calibration
- Manual entry or CSV import with flexible column detection
- **Open estimation:** entries saved from results page include full estimation snapshot — clicking "Open" restores the complete estimation on /results
- Auto-derived PM%/QA% rates from practice data used in future estimations

### 6. Exports
- Cost breakdown → CSV, XLSX, clipboard image
- Resource plan → CSV, XLSX
- Full page → browser print

---

## Key Types (src/lib/types.ts)

```typescript
Estimation {
  projectName, summary, phases[], timeline[], costBreakdown[],
  totalCost { amount, currency }, team[], risks[],
  deliverables[], assumptions[], limitations[], customComponents[]
}

CostItem {
  phase, category, description, roles: RoleBreakdown[],
  totalHours, totalMD, totalCost, confidence,
  optimisticHours?, pessimisticHours?, confirmed?, userConfidence?
}

RoleBreakdown { role: "CS"|"Dev"|"AR"|"PM"|"QA", hours, rate, cost }

PracticeEstimation {
  id, projectName, projectType, description,
  actualTimeline, actualCost, teamSize, techStack, lessonsLearned,
  csMD?, devMD?, arMD?, pmMD?, qaMD?, totalMD?,
  csHours?, devHours?, arHours?, pmHours?, qaHours?,
  csRate?, devRate?, arRate?, pmRate?, qaRate?, currency?,
  fullEstimation?  // JSON snapshot of full Estimation object
}
```

---

## Role Rates (defaults in constants.ts)

| Role | Default Rate | Notes |
|------|-------------|-------|
| CS (Consultant) | $150/hr | Direct hourly rate |
| Dev (Developer) | $130/hr | Direct hourly rate |
| AR (Architect) | $175/hr | Direct hourly rate |
| PM (Project Manager) | 15% | % of CS+Dev+AR hours, blended rate |
| QA (Quality Assurance) | 20% | % of CS+Dev+AR hours, blended rate |

**1 Man-Day = 8 hours** (`HOURS_PER_MD` constant)

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@anthropic-ai/sdk` | Claude API client |
| `next` 16.1.6 | React framework |
| `react` 19.2.3 | UI library |
| `pdf-parse` | PDF text extraction (server-only) |
| `mammoth` | DOCX text extraction |
| `xlsx` | Excel/CSV file generation |
| `html2canvas` | Screenshot to clipboard |
| `lucide-react` | UI icons |
| `tailwindcss` v4 | Styling |

---

## Recent Changes (March 2026)

### Open Estimations from Practice Library
- `fullEstimation` field added to `PracticeEstimation` — stores serialized JSON of full `Estimation` object when saving from results page
- Practice cards show "Open" button (enabled for entries with full data, disabled for legacy entries)
- Clicking Open restores the estimation to sessionStorage and navigates to /results

### Resource Plan Gap Optimization
- Gap detection: scans weekly totals for consecutive zero-allocation periods
- Compress view: toggles hiding empty columns (visual only, doesn't modify data)
- Optimize Timeline: shifts timeline phases earlier to close idle gaps, updates week numbers and dates, recalculates resource plan automatically

### Files Modified
1. `src/lib/types.ts` — `fullEstimation?: string` on PracticeEstimation
2. `src/app/results/page.tsx` — stores full estimation JSON on save, passes `updateEstimation` to ResourcePlan
3. `src/app/practice/page.tsx` — Open button, router navigation, preserves fullEstimation on edit
4. `src/lib/resource-plan.ts` — `ResourceGap` interface, gap detection in `buildResourcePlan`, `compressResourcePlan()`, `optimizeTimeline()`
5. `src/components/ResourcePlan.tsx` — gap warning banner, compress toggle, optimize timeline button
6. `src/components/EstimationResults.tsx` — threads `onUpdateEstimation` callback to ResourcePlan
