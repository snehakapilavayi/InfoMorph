import {
  OutputType,
  SourceCorpusItem,
  OutputItem,
  ProjectItem,
  SourceOfTruth,
  QuestionnairePreferences,
  ClaimItem
} from '@/types';
import { tokenizeTextIntoSpans } from './tokenizer';

export const INITIAL_CORPUS: SourceCorpusItem[] = [
  {
    id: 'src-1',
    name: 'AI in Education Report.pdf',
    fileType: 'pdf',
    size: '2.4 MB',
    pages: 24,
    uploadedAt: 'Uploaded 2 mins ago',
    isPrimary: true,
    rawText: `GLOBAL EDUCATION FUTURES INITIATIVE
RESEARCH REPORT: ARTIFICIAL INTELLIGENCE IN EDUCATION (AIED) — 2026 BENCHMARK

1. Executive Summary:
Education is evolving rapidly, and artificial intelligence is leading the way.
Our latest comprehensive evaluation demonstrates how generative AI and adaptive learning algorithms are personalizing student engagement, empowering classroom educators, and driving measurable learning outcomes.
Over 1,200 institutions across 42 countries participated in this longitudinal analysis.

2. Core Pedagogical Findings:
Adaptive learning platforms have demonstrated a 34% increase in student retention rates across STEM curriculums.
Personalized feedback loops reduce grading overhead for educators by an average of 6.5 hours per week, permitting more 1-on-1 student mentorship.
Ethical governance protocols, including strict algorithmic bias prevention and zero retention of minor biometric data, are mandated across 88% of leading school districts.

3. Implementation Recommendations:
Institutions must establish human-in-the-loop oversight for all AI-generated curriculum suggestions.
Professional development training must be provided to 100% of teaching faculty before classroom deployment.
Infrastructure grants should prioritize equitable digital access in underprivileged districts to avoid widening the digital educational divide.`
  },
  {
    id: 'src-2',
    name: 'Future of Work.docx',
    fileType: 'docx',
    size: '1.1 MB',
    pages: 18,
    uploadedAt: 'Uploaded 3 days ago',
    isPrimary: false,
    rawText: `FUTURE OF WORK AND WORKFORCE AUTOMATION
Executive brief analyzing the shifts in remote collaboration, cognitive task augmentation, and reskilling requirements in Fortune 500 enterprises.`
  },
  {
    id: 'src-3',
    name: 'EdTech Trends 2024.pdf',
    fileType: 'pdf',
    size: '3.2 MB',
    pages: 32,
    uploadedAt: 'Uploaded 1 week ago',
    isPrimary: false,
    rawText: `EDTECH MARKET ANALYSIS & TRENDS
Global market overview of immersive VR classrooms, micro-credentialing platforms, and AI tutor deployments.`
  },
  {
    id: 'src-4',
    name: 'AI Statistics 2024.csv',
    fileType: 'csv',
    size: '850 KB',
    pages: '1,420 rows',
    uploadedAt: 'Uploaded 2 weeks ago',
    isPrimary: false,
    rawText: `Country,AdoptionRate,RetentionDelta,TeacherTimeSavedHours
US,74%,+32%,6.2
India,81%,+38%,7.4
UK,68%,+29%,5.8
Germany,62%,+25%,5.1`
  }
];

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-1',
    title: 'AI in Education Transformation',
    description: 'Multi-channel transformation of the global AIED research benchmark into social posts, articles, and briefs.',
    primarySource: 'AI in Education Report.pdf',
    outputsCount: 6,
    qualityScore: 98,
    lastUpdated: '10 mins ago',
    status: 'Completed'
  },
  {
    id: 'proj-2',
    title: 'NTRO Threat Response & Critical Advisory',
    description: 'Automated conversion of industrial SCADA zero-day kernel advisories into emergency operator alerts.',
    primarySource: 'NTRO Cyber Advisory: CVE-2026-1104',
    outputsCount: 5,
    qualityScore: 98,
    lastUpdated: '2 hours ago',
    status: 'Completed'
  },
  {
    id: 'proj-3',
    title: 'Sovereign AI & National Compute Framework',
    description: 'Government policy brief transformation for research labs, AI startups, and academic institutions.',
    primarySource: 'MeitY Sovereign Compute 2026',
    outputsCount: 4,
    qualityScore: 96,
    lastUpdated: 'Yesterday',
    status: 'In Progress'
  }
];

export const DEFAULT_PREFERENCES: QuestionnairePreferences = {
  audience: 'Technical',
  tone: 'Professional',
  language: 'English (US)',
  outputCategory: 'Post',
  objective: 'Inform',
  selectedFormats: [
    'instagram',
    'youtube',
    'linkedin',
    'blog',
    'whatsapp',
    'twitter'
  ]
};

export const INITIAL_OUTPUTS: OutputItem[] = [
  {
    id: 'out-linkedin',
    outputType: 'linkedin',
    title: 'LinkedIn Post',
    subtitle: 'Professional post for LinkedIn',
    content: `Education is evolving, and AI is leading the way.

Our latest report explores how AI technologies are transforming learning experiences, personalizing education, and empowering educators.

✓ Smarter learning
✓ Personalized education
✓ Better outcomes for all

Read the full report to explore key insights and recommendations.

#AI #Education #FutureOfLearning #Innovation`,
    qualityScore: 97,
    characterCount: 428,
    groundedPercent: 98,
    status: 'ready',
    hashtags: ['AI', 'Education', 'FutureOfLearning', 'Innovation'],
    claims: [
      {
        id: 'c-li-1',
        outputType: 'linkedin',
        claimText: 'AI technologies are personalizing education and empowering educators.',
        sourceSpanIds: ['S2'],
        grounded: true,
        contradictionFlag: false
      },
      {
        id: 'c-li-2',
        outputType: 'linkedin',
        claimText: 'Longitudinal study covered over 1,200 institutions across 42 countries.',
        sourceSpanIds: ['S3'],
        grounded: true,
        contradictionFlag: false
      }
    ]
  },
  {
    id: 'out-instagram',
    outputType: 'instagram',
    title: 'Instagram Post',
    subtitle: 'Engaging post with caption & hashtags',
    content: `How AI is reshaping modern education across the globe 🚀✨

Key Grounded Takeaways:
• 34% increase in STEM retention rates through adaptive learning algorithms
• Teachers reclaim an average of 6.5 hours/week for 1-on-1 student mentorship
• Ethical guardrails: Zero biometric data retention for minors
• Equitable digital access remains the next crucial frontier

Double-tap if you believe technology can empower every learner. Full research breakdown link in bio! 📚💡

#AIinEducation #EdTech #FutureOfLearning #SmartClassroom #TeacherLife`,
    qualityScore: 98,
    characterCount: 540,
    groundedPercent: 98,
    status: 'ready',
    hashtags: ['AIinEducation', 'EdTech', 'FutureOfLearning', 'SmartClassroom'],
    claims: [
      {
        id: 'c-ig-1',
        outputType: 'instagram',
        claimText: 'Adaptive learning platforms demonstrate a 34% increase in STEM retention.',
        sourceSpanIds: ['S4'],
        grounded: true,
        contradictionFlag: false
      },
      {
        id: 'c-ig-2',
        outputType: 'instagram',
        claimText: 'Educators save an average of 6.5 hours per week on grading overhead.',
        sourceSpanIds: ['S5'],
        grounded: true,
        contradictionFlag: false
      }
    ]
  },
  {
    id: 'out-youtube',
    outputType: 'youtube',
    title: 'YouTube Post',
    subtitle: 'Title, description & tags',
    content: `Title: How AI Is Transforming Modern Education (2026 Research Breakdown)

Description:
Is AI helping or hurting students? In this in-depth analysis of the 2026 AI in Education Report, we break down real data from 1,200+ institutions worldwide.

Timestamps:
0:00 - The State of AI in Classrooms
1:45 - 34% Higher Retention in STEM
3:10 - How Teachers Save 6.5 Hours Weekly
5:00 - Data Privacy & Ethical Guardrails
6:45 - Key Takeaways & Recommendations

Download the full research brief in the pinned comment below!

Tags: AI in education, edtech 2026, adaptive learning, future of schools, AI classroom`,
    qualityScore: 97,
    characterCount: 620,
    groundedPercent: 97,
    status: 'ready',
    hashtags: ['EdTech', 'AIinEducation', 'FutureSchools'],
    claims: [
      {
        id: 'c-yt-1',
        outputType: 'youtube',
        claimText: '1,200 institutions analyzed with 34% STEM retention uplift.',
        sourceSpanIds: ['S3', 'S4'],
        grounded: true,
        contradictionFlag: false
      }
    ]
  },
  {
    id: 'out-blog',
    outputType: 'blog',
    title: 'Blog / Article',
    subtitle: 'SEO-friendly blog/article',
    content: `# The AI Classroom Revolution: Key Findings from the 2026 Education Benchmark

## Executive Overview
Artificial intelligence is no longer an experimental curiosity in schools; it is an established catalyst for personalized instruction and teacher empowerment. Drawing on observations from 1,200 institutions across 42 nations, our 2026 benchmark presents undeniable proof of positive pedagogical impact.

## Measurable Academic Outcomes
- **STEM Retention:** Courses utilizing adaptive AI modules measured a **34% gain in retention**, closing comprehension gaps in algebra and chemistry.
- **Educator Workload:** Automated assessment tools relieved teachers of **6.5 hours of grading per week**, directly redirecting focus to individualized student mentoring.

## Ethical AI Deployment Principles
1. **Human-in-the-Loop:** Automated suggestions must always remain subject to educator verification.
2. **Minor Data Protection:** Strict zero-retention policies for minor biometric or behavioural data.
3. **Equitable Access:** Infrastructure investment must prioritize underserved schools.`,
    qualityScore: 97,
    characterCount: 1120,
    groundedPercent: 97,
    status: 'ready',
    claims: [
      {
        id: 'c-bl-1',
        outputType: 'blog',
        claimText: '34% gain in STEM retention and 6.5 hours of grading saved per week.',
        sourceSpanIds: ['S4', 'S5'],
        grounded: true,
        contradictionFlag: false
      }
    ]
  },
  {
    id: 'out-whatsapp',
    outputType: 'whatsapp',
    title: 'WhatsApp Channel',
    subtitle: 'Channel update message',
    content: `📢 *GLOBAL EDUCATION REPORT 2026*

Key takeaways on how AI is empowering classrooms:

✨ *Key Highlights:*
• 34% higher student retention in STEM subjects
• 6.5 hours saved per teacher every week on grading
• 1,200+ schools surveyed in 42 countries

🛡️ *Safety Standard:* Strict zero-retention on student biometric data.

👉 Tap to read the complete executive briefing and implementation guide.`,
    qualityScore: 96,
    characterCount: 410,
    groundedPercent: 96,
    status: 'ready',
    claims: [
      {
        id: 'c-wa-1',
        outputType: 'whatsapp',
        claimText: '34% higher retention and 6.5 hours saved per teacher.',
        sourceSpanIds: ['S4', 'S5'],
        grounded: true,
        contradictionFlag: false
      }
    ]
  },
  {
    id: 'out-twitter',
    outputType: 'twitter',
    title: 'Twitter Post',
    subtitle: 'Tweet with key highlights',
    content: `AI isn't replacing teachers — it's empowering them.

Key findings from our 2026 AI in Education Report (1,200+ schools):
📊 +34% student retention in STEM
⏱️ 6.5 hrs/week saved on grading
🛡️ Zero minor biometric retention

Full report link below 🧵👇
#EdTech #AI #Education`,
    qualityScore: 96,
    characterCount: 272,
    groundedPercent: 96,
    status: 'ready',
    hashtags: ['EdTech', 'AI', 'Education'],
    claims: [
      {
        id: 'c-tw-1',
        outputType: 'twitter',
        claimText: '1,200+ schools, +34% retention, 6.5 hrs/week saved on grading.',
        sourceSpanIds: ['S3', 'S4', 'S5'],
        grounded: true,
        contradictionFlag: false
      }
    ]
  }
];

export const SOT_EDUCATION: SourceOfTruth = {
  summary: "Comprehensive evaluation of 1,200+ institutions across 42 countries demonstrating that generative AI and adaptive learning algorithms increase STEM retention by 34% and save educators 6.5 hours of grading weekly under strict privacy standards.",
  coreFacts: [
    {
      factId: 'F1',
      statement: 'Adaptive learning platforms demonstrated a 34% increase in student retention rates across STEM curriculums.',
      sourceSpans: ['S4']
    },
    {
      factId: 'F2',
      statement: 'Personalized feedback loops reduce grading overhead for educators by an average of 6.5 hours per week.',
      sourceSpans: ['S5']
    },
    {
      factId: 'F3',
      statement: 'Over 1,200 institutions across 42 countries participated in the longitudinal analysis.',
      sourceSpans: ['S3']
    },
    {
      factId: 'F4',
      statement: 'Ethical governance protocols mandate zero retention of minor biometric data across 88% of districts.',
      sourceSpans: ['S6']
    }
  ],
  entities: [
    { name: 'Global Education Futures', type: 'Organization' },
    { name: 'AIED 2026 Benchmark', type: 'Report' },
    { name: 'STEM Curriculums', type: 'Domain' },
    { name: '42 Countries', type: 'Demographic' }
  ],
  criticalMetrics: [
    { label: 'STEM Retention Increase', value: '+34%', sourceSpan: 'S4' },
    { label: 'Weekly Teacher Hours Saved', value: '6.5 Hours', sourceSpan: 'S5' },
    { label: 'Institutions Surveyed', value: '1,200+', sourceSpan: 'S3' },
    { label: 'Countries Covered', value: '42 Countries', sourceSpan: 'S3' }
  ]
};
