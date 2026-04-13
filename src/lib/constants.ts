export const SERVICE_LINES = [
  'Clean Energy Transition',
  'Climate Risk & Adaptation',
  'Investment & Transaction',
  'Data & Digital',
  'Programme Design',
] as const;

export const SERVICE_LINE_COLORS: Record<string, string> = {
  'Clean Energy Transition': '#E67E22',
  'Climate Risk & Adaptation': '#27AE60',
  'Investment & Transaction': '#2980B9',
  'Data & Digital': '#8E44AD',
  'Programme Design': '#E74C3C',
};

export const FUNNEL_STAGES = [
  'Lead Identified',
  'Initial Contact',
  'Discovery Meeting',
  'Proposal Development',
  'Proposal Submitted',
  'Negotiation',
  'Contract Signed',
  'Lost',
  'On Hold',
] as const;

export const STAGE_COLORS: Record<string, string> = {
  'Lead Identified': '#3498DB',
  'Initial Contact': '#2980B9',
  'Discovery Meeting': '#8E44AD',
  'Proposal Development': '#E67E22',
  'Proposal Submitted': '#F39C12',
  'Negotiation': '#E74C3C',
  'Contract Signed': '#27AE60',
  'Lost': '#7F8C8D',
  'On Hold': '#95A5A6',
};

export const STAGE_MAX_DAYS: Record<string, number> = {
  'Lead Identified': 14,
  'Initial Contact': 14,
  'Discovery Meeting': 21,
  'Proposal Development': 21,
  'Proposal Submitted': 30,
  'Negotiation': 30,
  'On Hold': 60,
};

export const STAGE_DEFAULT_PROBABILITY: Record<string, number> = {
  'Lead Identified': 10,
  'Initial Contact': 20,
  'Discovery Meeting': 30,
  'Proposal Development': 40,
  'Proposal Submitted': 50,
  'Negotiation': 70,
  'Contract Signed': 100,
  'Lost': 0,
  'On Hold': 10,
};

export const SOURCE_CHANNELS = [
  'Existing Client',
  'Existing Relationship',
  'Procurement Portal',
  'LinkedIn Outreach',
  'Referral',
  'Event/Conference',
  'Inbound Inquiry',
  'Cold Outreach',
  'Partner Introduction',
] as const;

export const RELATIONSHIP_STATUSES = ['Cold', 'Warming', 'Warm', 'Active', 'Champion'] as const;

export const ACTIVITY_TYPES = [
  'Outbound Email',
  'Outbound Call',
  'LinkedIn Message',
  'Client Meeting (Virtual)',
  'Client Meeting (In-Person)',
  'Proposal Writing',
  'Demo Delivered',
  'Demo Video Recorded',
  'Case Study Written',
  'Material Designed',
  'Procurement Portal Scan',
  'Event/Conference',
  'Referral Made',
  'Technical Blog Post',
  'Internal Demo Review',
] as const;

export const ORG_TYPES = [
  'Foundation', 'MDB', 'Bilateral', 'DFI', 'DFI Programme', 'Commercial Bank',
  'Insurance', 'Academic', 'Multilateral', 'Platform Partner', 'Other',
] as const;

export const SCORECARD_WEIGHTS = {
  Closer:  { opportunitiesFlagged: 3, outboundContacts: 2, clientMeetings: 4, proposalsContributed: 5, demosRun: 1, materialsCreated: 1, videosRecorded: 2, caseStudiesWritten: 3, portalScans: 0 },
  Hunter:  { opportunitiesFlagged: 4, outboundContacts: 2, clientMeetings: 3, proposalsContributed: 5, demosRun: 1, materialsCreated: 1, videosRecorded: 1, caseStudiesWritten: 2, portalScans: 3 },
  Enabler: { opportunitiesFlagged: 1, outboundContacts: 0, clientMeetings: 1, proposalsContributed: 3, demosRun: 5, materialsCreated: 4, videosRecorded: 5, caseStudiesWritten: 4, portalScans: 0 },
};

export const WEEKLY_TARGETS = {
  Closer:  { opportunitiesFlagged: 2, outboundContacts: 10, clientMeetings: 2, proposalsContributed: 1, demosRun: 0, materialsCreated: 0, videosRecorded: 0, portalScans: 0 },
  Hunter:  { opportunitiesFlagged: 1, outboundContacts: 2, clientMeetings: 1, proposalsContributed: 0.5, demosRun: 0, materialsCreated: 0, videosRecorded: 0, portalScans: 5 },
  Enabler: { opportunitiesFlagged: 0, outboundContacts: 0, clientMeetings: 0, proposalsContributed: 0, demosRun: 1, materialsCreated: 1, videosRecorded: 0.25, portalScans: 0 },
};

export const TIER_BADGE_COLORS: Record<string, string> = {
  Closer: '#C0392B',
  Hunter: '#2980B9',
  Enabler: '#8E44AD',
};

export const ROLES = ['admin', 'manager', 'team_member', 'viewer'] as const;
export const TIERS = ['Closer', 'Hunter', 'Enabler'] as const;
export const DEPARTMENTS = ['Leadership', 'Advisory', 'Tech'] as const;
