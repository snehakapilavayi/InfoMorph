# Product Requirements Document (PRD)
## INFOMORPH — One Source. Infinite Forms.
**AI-Powered Multimodal Content Transformation Platform**
**SIH Problem Statement ID:** SIH26154 | **Organisation:** NTRO | **Theme:** Smart Automation

---

## 1. Product Vision
One source → one understanding → many grounded outputs → multi-platform distribution.

Organisations spend hours manually converting a single piece of source content (a report, article, advisory, or video) into multiple communication formats for different audiences and platforms. INFOMORPH removes that manual effort while solving the problem competitors ignore: **outputs drifting apart and contradicting each other** when generated independently.

## 2. Problem Statement
Manually analysing source content and producing multiple required output formats (blog articles, social posts, advisories) is time-consuming, requires expertise, and risks factual inconsistency across outputs when done separately or by different people.

## 3. Target Users
- **Primary (hackathon framing):** Government/organisational operators who need to convert reports, advisories, and briefings into public-facing or internal communication formats quickly and reliably.
- **Secondary (broader product framing):** Communications teams, social media managers, and content creators who publish the same underlying story across multiple platforms.

## 4. Goals & Success Metrics
| Goal | Metric |
|---|---|
| Reduce manual repurposing effort | Processing time from upload to verified output |
| Ensure factual accuracy | Source-Grounding Rate (% of claims traceable to source) |
| Prevent cross-output contradictions | Cross-Output Consistency Score (% of shared claims consistent across outputs) |
| Minimise hallucination | Factual Error Rate (% of unsupported/contradicted claims) |
| Usability | Human Quality Score (reviewer rating on relevance, tone, usefulness) |

## 5. Product Flow
```
USER PORTAL
  → CREATE PROJECT
  → UPLOAD SOURCE (text / document / image → Cloudinary + Supabase)
  → PROCESS + UNDERSTAND SOURCE (Gemini API) → SOURCE OF TRUTH
  → SELECT OUTPUTS (LinkedIn, Instagram, Twitter/X, Blog/Article, WhatsApp Channel)
  → CONFIGURE (Audience | Tone | Language | Style)
  → GENERATE CONTENT (Gemini API)
  → VERIFY (Grounding + Cross-Output Consistency)
  → HUMAN REVIEW (Approve / Edit / Reject / Regenerate)
  → PUBLISH / SCHEDULE (LinkedIn, Instagram, Twitter/X, Blog, WhatsApp Channel*)
```
*WhatsApp Channel publishing has no official API path (Meta's Cloud API does not support posting to Channels) — content generation is real; publish action is simulated/roadmap only.

## 6. User Portal — Functional Sections

### 6.1 Create
- Upload source file (PDF, text, image)
- Paste text directly
- Add a source URL
- Create/select a project to group related source + outputs

### 6.2 Transform
- Select one or more output types: **LinkedIn Post, Instagram Post, Twitter/X Post, Blog/Article, WhatsApp Channel Post**
- Configure: Audience, Tone, Language, Level of Detail, Communication Objective, Style
- Trigger generation — all selected outputs generated from the same source context for consistency

### 6.3 Publish
- Post-verification status per output: ✅ Ready / ⚠️ Flagged
- Actions: **Publish Now | Schedule | Edit**
- Platforms shown: LinkedIn, Instagram, Twitter/X, Blog, WhatsApp Channel (labelled per platform's actual API readiness — see Section 9)

## 7. Core Differentiators (Novelty)
1. One shared source understanding drives multiple simultaneous outputs — not independent single-shot generations.
2. Source-grounding: every generated claim is traceable to the original source.
3. Cross-output consistency checking: automatically detects and flags contradicting facts (e.g. "500 users" vs "5,000 users") across generated outputs.
4. Configurable via simple settings rather than requiring prompt-engineering skill.
5. Publishing framed as part of the product flow, not an afterthought "export" step.

## 8. MVP Scope for Hackathon Prototype
**In scope — five output types, generated from one source:**
- LinkedIn Post
- Instagram Post
- Twitter/X Post
- Blog/Article
- WhatsApp Channel Post (generation only — see Section 9)

**Also in scope:**
- One input modality: pasted text or uploaded PDF/document
- Visible source-grounding: each generated sentence links back to its source line/section
- Visible consistency check: shared factual claims across outputs compared, contradictions flagged
- Human review step: approve/edit/reject/regenerate
- Publish section UI fully built and clickable; actual publish action simulated (see Section 9)

**Out of scope for prototype (roadmap only):**
- Video Package, Infographic, Presentation, Executive Summary, Advisory generation
- Real vector database / full RAG pipeline (simplified grounding via LLM-tagged source spans for MVP)
- Live publishing to any platform requiring App Review approval
- Real WhatsApp Channel posting (no official API exists)

## 9. Publishing — Platform Reality Check
| Platform | Prototype Behaviour | Production Path |
|---|---|---|
| LinkedIn | Simulated (or sandbox test, time permitting) | LinkedIn API, `w_member_social` scope — Partner Program access required |
| Instagram | Simulated | Meta Graph API — requires App Review |
| Twitter/X | Simulated | X API — developer access tier required |
| Blog/Article | Simulated ("published" to a placeholder blog endpoint) | Platform-dependent (WordPress API, Medium API, custom CMS) |
| WhatsApp Channel | Not implemented — generation only, publish simulated/roadmap | No official API exists; Meta's Cloud API does not support Channel posting as of current documentation |

This distinction should be stated plainly in the demo and PPT — it demonstrates architectural understanding of real deployment constraints rather than overselling capability.

## 10. Risks (Product-Level)
- Overselling generation as "complete" when publishing is simulated — demo and PPT must be scoped honestly.
- Judges probing whether the demo shows the actual novelty (grounding + consistency) rather than just "LLM wrapper" — this must be visibly demonstrated, not just claimed.
- Publishing claims must not imply live posting has been achieved without App Review or, for WhatsApp Channel, without an API that exists at all.

## 11. Deliverables (Per SIH Evaluation Requirements)
- Source code (GitHub/Drive link)
- README with setup instructions
- Architecture Document (max 2 pages)
- Demo video (max 2 minutes)
- Technical Presentation (max 5 slides)
