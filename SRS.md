# Software Requirements Specification (SRS)
## INFOMORPH — One Source. Infinite Forms.
**AI-Powered Multimodal Content Transformation Platform**
**SIH26154 | NTRO | Smart Automation**

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for the INFOMORPH hackathon prototype and its production-scope superset, covering the Create → Transform → Publish product flow.

### 1.2 Scope
The system ingests source content, generates five grounded and mutually-consistent output artefacts (LinkedIn Post, Instagram Post, Twitter/X Post, Blog/Article, WhatsApp Channel Post), and provides a review and multi-platform publishing/distribution layer.

### 1.3 Definitions
- **Source of Truth (SoT):** the structured, fact-extracted representation of the uploaded source content, shared across all generation calls.
- **Grounding:** the property that a generated claim can be traced to a specific span in the source content.
- **Cross-Output Consistency:** the property that shared factual claims (numbers, names, dates) remain identical across all outputs generated from one source.

---

## 2. Overall Description

### 2.1 Product Perspective
Standalone web platform (User Portal) backed by Gemini API for understanding/generation, Supabase for structured data persistence, and Cloudinary for media (image) storage.

### 2.2 User Classes
- **Operator:** uploads source, selects outputs, configures generation, reviews and publishes.
- **(Future) Admin:** manages users, audit logs, retention policy, RBAC.

### 2.3 Operating Environment
Web application, browser-based frontend, cloud-hosted backend (hackathon: single-service deployment; production: containerised, per R&D architecture).

---

## 3. Functional Requirements

### FR-1: Source Ingestion
- FR-1.1: System shall accept source content as pasted text, uploaded PDF/document, or (future) image/video.
- FR-1.2: System shall store the source content and associated metadata in Supabase (`sources` table).
- FR-1.3: Image assets, where present, shall be stored via Cloudinary and referenced by URL in Supabase.

### FR-2: Content Understanding
- FR-2.1: System shall call the Gemini API to extract key facts, entities, and claims from the source content.
- FR-2.2: System shall produce a structured Source of Truth object referenced by all subsequent generation calls.

### FR-3: Output Selection & Configuration
- FR-3.1: Operator shall be able to select one or more of the five supported output types: LinkedIn Post, Instagram Post, Twitter/X Post, Blog/Article, WhatsApp Channel Post.
- FR-3.2: Operator shall be able to configure Audience, Tone, Language, Level of Detail, Objective, and Style.

### FR-4: Content Generation
- FR-4.1: System shall generate all selected outputs from the same Source of Truth in a single orchestrated request/response cycle (not independent calls per output).
- FR-4.2: Each generated output shall be stored in Supabase (`outputs` table) linked to its source.
- FR-4.3: Each generated sentence/claim shall be tagged with a reference to the source span it derives from.

### FR-5: Verification
- FR-5.1: System shall verify each generated claim against the source content and mark it as grounded or unsupported.
- FR-5.2: System shall compare shared factual claims (numbers, names, dates, entities) across all generated outputs and flag contradictions.
- FR-5.3: Verification results shall be stored in Supabase (`claims` table) with fields for claim text, source reference, verified status, and contradiction flag.
- FR-5.4: System shall surface flagged/unsupported claims to the operator before publishing is enabled.

### FR-6: Human Review
- FR-6.1: Operator shall be able to preview, edit, approve, reject, or trigger regeneration of any output.
- FR-6.2: An output shall not be publishable until it has passed review (approved) or the operator explicitly overrides a flagged claim.

### FR-7: Publish / Distribution
- FR-7.1: System shall present publish status per output (Ready / Flagged) per target platform.
- FR-7.2: Operator shall be able to trigger Publish Now, Schedule, or Edit actions.
- FR-7.3: For the hackathon prototype, publish actions to LinkedIn, Instagram, Twitter/X, and Blog shall be simulated (mocked network call, realistic UI state transitions) unless live sandbox credentials are available and verified.
- FR-7.4: WhatsApp Channel publishing shall not be implemented as a real integration — no official API exists for posting to WhatsApp Channels via Meta's Cloud API; it shall be represented as generation-only, with publish simulated/roadmap.

### FR-8: Audit
- FR-8.1: System shall log each transformation and publish action with timestamp and operator identity (production scope; optional for MVP).

---

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | End-to-end processing (upload → verified outputs) should complete within a demo-acceptable time window (target: under 60 seconds for MVP-scale input) |
| Reliability | Gemini API calls shall have basic retry/error handling; failures shall surface a clear error state, not a silent failure |
| Security | Source content and generated outputs shall be stored per-project; production scope includes RBAC, encryption at rest, and audit logging |
| Usability | Operator shall not require prompt-engineering skill — all generation control via structured settings (audience/tone/etc.) |
| Data Integrity | Claims and contradiction flags shall be traceable back to the exact output and source span that produced them |
| Extensibility | Architecture shall allow adding new output types or platforms without redesigning the core generation/verification pipeline |

---

## 5. External Interface Requirements

### 5.1 Gemini API
- Used for: content understanding/fact extraction, multi-output generation (5 formats), claim verification, cross-output consistency checking.
- Interface: REST API calls with source content + configuration parameters as input; structured JSON (claims, outputs, source references) as output.

### 5.2 Supabase
- Used for: persistence of sources, outputs, claims, and (production) audit logs.
- Interface: Supabase client SDK / REST API; Postgres schema as defined in SDD.

### 5.3 Cloudinary
- Used for: image asset storage and retrieval where source or generated content includes images.
- Interface: Cloudinary upload API; returns hosted URL stored in Supabase.

### 5.4 Publishing APIs (Production Scope)
- Meta Graph API (Instagram) — requires App Review for publishing scopes.
- LinkedIn API (`w_member_social`) — requires Partner Program access.
- X/Twitter API — requires developer access tier.
- Blog: platform-dependent (WordPress API, Medium API, or custom CMS).
- WhatsApp Channel: no official publishing API exists — confirmed not supported by Meta's Cloud API as of current documentation. Excluded from production integration plan pending any future official API release.

---

## 6. Constraints
- Hackathon timeline restricts the prototype to one input modality; all five output types are in scope but publishing is simulated for all except possibly a verified LinkedIn sandbox test.
- Live publishing cannot be demonstrated for platforms requiring App Review approval not already granted.
- WhatsApp Channel has no real publish path at all — must not be demoed as "publishing," only as content generation.
- Full RAG/vector-database grounding is simplified to LLM-tagged source-span references for the MVP; production scope uses embeddings + vector store per the R&D architecture.
