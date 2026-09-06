# System Design Document (SDD)
## INFOMORPH — One Source. Infinite Forms.
**AI-Powered Multimodal Content Transformation Platform**
**SIH26154 | NTRO | Smart Automation**

---

## 1. Architecture Overview

```
USER PORTAL (React frontend)
       │
       ▼
CREATE ──► Upload/Paste/URL ──► Cloudinary (images) + Supabase (sources table)
       │
       ▼
PROCESS + UNDERSTAND SOURCE ──► Gemini API ──► Source of Truth (structured facts/claims/entities)
       │
       ▼
TRANSFORM ──► Select Outputs (LinkedIn / Instagram / Twitter-X / Blog / WhatsApp Channel)
              + Configure (Audience/Tone/Language/Style)
       │
       ▼
GENERATE ──► Gemini API (single orchestrated call, shared context) ──► Outputs (Supabase: outputs table)
       │
       ▼
VERIFY ──► Grounding check + Cross-Output Consistency check ──► Claims (Supabase: claims table)
       │
       ▼
HUMAN REVIEW ──► Approve / Edit / Reject / Regenerate
       │
       ▼
PUBLISH / SCHEDULE ──► LinkedIn | Instagram | Twitter/X | Blog (simulated) | WhatsApp Channel (generation only)
```

## 2. Component Design

### 2.1 Frontend (React + Tailwind)
- **Create view:** file upload, text paste, URL input, project list/selector.
- **Transform view:** multi-select across 5 output types, configuration panel, "Generate" trigger, loading state.
- **Review view:** side-by-side output display for all generated formats; clicking a sentence highlights its source span; a consistency panel lists flagged contradictions.
- **Publish view:** per-output status badges (Ready/Flagged), Publish Now / Schedule / Edit buttons, simulated publish confirmation states; WhatsApp Channel shown with a distinct "generation only — no publish API available" badge rather than a live publish button.

### 2.2 Backend / Orchestration
- Lightweight API layer (FastAPI or Node/Express) handling:
  - Source ingestion endpoint → stores to Supabase, uploads images to Cloudinary
  - Understanding endpoint → calls Gemini, stores Source of Truth
  - Generation endpoint → calls Gemini with SoT + config, stores all 5 output types
  - Verification endpoint → calls Gemini for grounding + consistency check, stores claims
  - Publish endpoint → simulated publish state transition (mocked for MVP; WhatsApp Channel always simulated)

### 2.3 Gemini API Usage (3 call types)
1. **Understanding call:** input = raw source text → output = structured facts/entities/claims (Source of Truth).
2. **Generation call:** input = Source of Truth + operator config + selected output types → output = LinkedIn Post, Instagram Post, Twitter/X Post, Blog/Article, and WhatsApp Channel Post, each sentence tagged with a source-span reference.
3. **Verification call:** input = all generated outputs + Source of Truth → output = per-claim grounded/unsupported status + cross-output contradiction flags.

### 2.4 Data Storage
- **Supabase (Postgres):** structured relational data — sources, outputs, claims, (future) audit logs.
- **Cloudinary:** binary image assets, referenced by URL from Supabase rows.

---

## 3. Database Schema (Supabase / Postgres)

```sql
create table sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  raw_text text,
  file_url text,          -- Cloudinary URL if image/file source
  source_type text,        -- 'text' | 'pdf' | 'image'
  created_at timestamp default now()
);

create table source_of_truth (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id),
  facts jsonb,             -- extracted facts/entities/claims
  created_at timestamp default now()
);

create table outputs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id),
  output_type text,        -- 'linkedin' | 'instagram' | 'twitter' | 'blog' | 'whatsapp_channel'
  content text,
  status text default 'draft',  -- 'draft' | 'approved' | 'flagged' | 'published' | 'scheduled'
  created_at timestamp default now()
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  output_id uuid references outputs(id),
  claim_text text,
  source_span text,        -- reference back to source_of_truth / raw_text location
  grounded boolean,
  contradiction_flag boolean default false,
  contradicting_output_id uuid references outputs(id),
  created_at timestamp default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamp default now()
);
```

---

## 4. Sequence Flow (Textual)

1. Operator creates a project and uploads/pastes source content.
2. Frontend sends source to backend → backend stores in `sources`, uploads any image to Cloudinary, stores URL.
3. Backend calls Gemini (Understanding call) → stores result in `source_of_truth`.
4. Operator selects output types (any/all of the 5) + configuration in Transform view.
5. Backend calls Gemini (Generation call) with SoT + config → stores each output in `outputs`.
6. Backend calls Gemini (Verification call) with all outputs + SoT → stores results in `claims`, updates `outputs.status` to `flagged` where contradictions exist.
7. Operator reviews outputs in Review view; approves, edits, or triggers regeneration (loops back to step 5 for that output only).
8. Operator moves to Publish view; approved outputs show `Ready`; flagged ones show `Flagged` until resolved.
9. Operator clicks Publish Now / Schedule → backend transitions `outputs.status` to `published`/`scheduled` (simulated call for LinkedIn/Instagram/Twitter/Blog; WhatsApp Channel always shows generation-only status since no publish API exists).

---

## 5. Technology Stack Mapping

| Layer | Technology |
|---|---|
| Frontend | React.js + Tailwind CSS |
| Backend/Orchestration | FastAPI (or Node/Express) |
| AI Understanding & Generation | Gemini API |
| Structured Data Store | Supabase (Postgres) |
| Media Storage | Cloudinary |
| Publishing (production) | Meta Graph API (Instagram), LinkedIn API, X API, Blog CMS API |
| Publishing (MVP) | Simulated/mocked publish state transitions; WhatsApp Channel excluded (no API exists) |

---

## 6. Design Notes & Simplifications for MVP

- **Grounding:** production R&D specifies a full RAG pipeline (embeddings + vector DB). MVP simplifies this to Gemini directly tagging generated sentences with source-span references in the same call — functionally demonstrates grounding without the infrastructure overhead of a vector store.
- **Consistency checking:** production R&D specifies NLI-based entailment checking plus self-consistency sampling. MVP uses a single Gemini verification call comparing extracted claims across outputs — same functional outcome (contradiction detection), simplified execution path.
- **Publishing:** architected as a first-class part of the flow (not "export"), but implemented as simulated state transitions in the prototype due to Meta/LinkedIn/X App Review and access-tier requirements that cannot be completed within a hackathon timeline.
- **WhatsApp Channel:** included as a generation target (content is real and useful) but explicitly excluded from any real publish integration, since no official API exists for posting to WhatsApp Channels via Meta's Cloud API.

## 7. Risks Mapped to Design Decisions
| Risk | Design Mitigation |
|---|---|
| Hallucinated/unsupported claims | Verification call blocks publish until grounded or operator override |
| Cross-output factual drift | Single shared Source of Truth + explicit consistency-check step before review |
| Overselling live publishing | Publish flow fully functional in UI; actual network calls clearly simulated and disclosed |
| Overselling WhatsApp Channel | Represented as generation-only in UI and docs; never shown as a live publish action |
| Time overrun on non-core features | Video/Infographic/Presentation/Executive Summary/Advisory generation explicitly excluded from MVP scope |
