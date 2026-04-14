import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import bcrypt from 'bcryptjs';

async function main() {
  const pw = await bcrypt.hash('bayes2026', 10);

  const users = [
    { name: 'Evans Kayo', email: 'ekayo@bayesconsulting.com', role: 'admin', tier: 'Closer', department: 'Leadership', title: 'Managing Partner & CEO', targetsAssigned: 'Top 5 accounts' },
    { name: 'Dennis Nderitu', email: 'dnderitu@bayesconsulting.com', role: 'manager', tier: 'Hunter', department: 'Advisory', title: 'Partner — Energy Lead', targetsAssigned: 'GIZ, FCDO/BII, Britam, Sida, + 1' },
    { name: 'Howard Piwang', email: 'hpiwang@bayesconsulting.com', role: 'manager', tier: 'Hunter', department: 'Advisory', title: 'Technical Energy Lead', targetsAssigned: 'AfDB, World Bank ESMAP, Jubilee, + 2' },
    { name: 'Leslie Igiraneza', email: 'ligiraneza@bayesconsulting.com', role: 'team_member', tier: 'Hunter', department: 'Advisory', title: 'Energy Associate', targetsAssigned: 'GEAPP, Rockefeller, IRENA, + 2' },
    { name: 'Wilson Mungai', email: 'wmungai@bayesconsulting.com', role: 'team_member', tier: 'Hunter', department: 'Advisory', title: 'Business & Partnerships', targetsAssigned: 'SE4ALL, EIB, Equity Bank, + 2' },
    { name: 'Joan Wanjiku', email: 'jwanjiku@bayesconsulting.com', role: 'team_member', tier: 'Hunter', department: 'Advisory', title: 'Business & Partnerships', targetsAssigned: 'Enabel, USAID, KCB, + 2' },
    { name: 'Sharon Nyongesa', email: 'snyongesa@bayesconsulting.com', role: 'team_member', tier: 'Enabler', department: 'Tech', title: 'Full Stack Engineer', targetsAssigned: 'Lovelace demo owner' },
    { name: 'Mohammed Gudle', email: 'mgudle@bayesconsulting.com', role: 'manager', tier: 'Enabler', department: 'Tech', title: 'Product Manager', targetsAssigned: 'Product & UX lead' },
    { name: 'James Kanyiri', email: 'jkanyiri@bayesconsulting.com', role: 'team_member', tier: 'Enabler', department: 'Tech', title: 'AI Engineer', targetsAssigned: 'Generic agent demo' },
    { name: 'Amos Wanene', email: 'awanene@bayesconsulting.com', role: 'team_member', tier: 'Enabler', department: 'Tech', title: 'AI Engineer', targetsAssigned: 'AfCEN demo owner' },
    { name: 'Felix Kuria', email: 'fkuria@bayesconsulting.com', role: 'team_member', tier: 'Enabler', department: 'Tech', title: 'AI Engineer', targetsAssigned: 'Climate risk dashboard' },
    { name: 'Naima Yusuf', email: 'nyusuf@bayesconsulting.com', role: 'team_member', tier: 'Enabler', department: 'Tech', title: 'Graphics Designer', targetsAssigned: 'Capabilities deck owner' },
    { name: 'Julian Tanui', email: 'jtanui@bayesconsulting.com', role: 'team_member', tier: 'Enabler', department: 'Tech', title: 'AI Engineer', targetsAssigned: 'eTIMS invoice demo' },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: pw },
    });
    createdUsers[u.name] = user.id;
  }

  const conversationTargets: Record<string, { weekly: number; quarterly: number }> = {
    'Evans Kayo': { weekly: 10, quarterly: 130 },
    'Dennis Nderitu': { weekly: 5, quarterly: 65 },
    'Wilson Mungai': { weekly: 5, quarterly: 65 },
    'Joan Wanjiku': { weekly: 5, quarterly: 65 },
    'Howard Piwang': { weekly: 4, quarterly: 52 },
    'Leslie Igiraneza': { weekly: 4, quarterly: 52 },
    'Sharon Nyongesa': { weekly: 2, quarterly: 26 },
    'Mohammed Gudle': { weekly: 2, quarterly: 26 },
    'James Kanyiri': { weekly: 1, quarterly: 13 },
    'Amos Wanene': { weekly: 1, quarterly: 13 },
    'Felix Kuria': { weekly: 1, quarterly: 13 },
    'Naima Yusuf': { weekly: 1, quarterly: 13 },
    'Julian Tanui': { weekly: 1, quarterly: 13 },
  };

  for (const user of users) {
    const targets = conversationTargets[user.name];
    if (!targets) continue;
    await prisma.weeklyQuota.upsert({
      where: { userId: createdUsers[user.name] },
      update: {
        tier: user.tier,
        weeklyTarget: targets.weekly,
        quarterlyTarget: targets.quarterly,
      },
      create: {
        userId: createdUsers[user.name],
        tier: user.tier,
        weeklyTarget: targets.weekly,
        quarterlyTarget: targets.quarterly,
      },
    });
  }

  const orgs = [
    { name: 'CIFF', type: 'Foundation', owner: 'Evans Kayo', serviceLineFit: '["Clean Energy Transition","Climate Risk & Adaptation"]' },
    { name: 'FSD Africa', type: 'DFI Programme', owner: 'Evans Kayo', serviceLineFit: '["Investment & Transaction","Data & Digital"]' },
    { name: 'AfCEN', type: 'Platform Partner', owner: 'Evans Kayo', serviceLineFit: '["Data & Digital","Clean Energy Transition"]' },
    { name: 'GIZ Kenya', type: 'Bilateral', owner: 'Dennis Nderitu', serviceLineFit: '["Clean Energy Transition","Programme Design"]' },
    { name: 'FCDO / BII', type: 'Bilateral', owner: 'Dennis Nderitu', serviceLineFit: '["Investment & Transaction","Climate Risk & Adaptation"]' },
    { name: 'AfDB', type: 'MDB', owner: 'Howard Piwang', serviceLineFit: '["Clean Energy Transition","Investment & Transaction","Programme Design"]' },
    { name: 'World Bank ESMAP', type: 'MDB', owner: 'Howard Piwang', serviceLineFit: '["Clean Energy Transition","Programme Design"]' },
    { name: 'GEAPP', type: 'Foundation', owner: 'Leslie Igiraneza', serviceLineFit: '["Clean Energy Transition","Data & Digital"]' },
    { name: 'Rockefeller Foundation', type: 'Foundation', owner: 'Leslie Igiraneza', serviceLineFit: '["Clean Energy Transition","Climate Risk & Adaptation"]' },
    { name: 'SE4ALL', type: 'Multilateral', owner: 'Wilson Mungai', serviceLineFit: '["Clean Energy Transition","Data & Digital","Programme Design"]' },
    { name: 'EIB', type: 'MDB', owner: 'Wilson Mungai', serviceLineFit: '["Investment & Transaction","Climate Risk & Adaptation"]' },
    { name: 'Enabel', type: 'Bilateral', owner: 'Joan Wanjiku', serviceLineFit: '["Clean Energy Transition","Programme Design"]' },
    { name: 'USAID Power Africa', type: 'Bilateral', owner: 'Joan Wanjiku', serviceLineFit: '["Clean Energy Transition","Investment & Transaction"]' },
    { name: 'Strathmore University', type: 'Academic', owner: 'Evans Kayo', serviceLineFit: '["Data & Digital","Clean Energy Transition"]' },
    { name: 'Equity Bank', type: 'Commercial Bank', owner: 'Wilson Mungai', serviceLineFit: '["Investment & Transaction","Data & Digital"]' },
    { name: 'KCB Group', type: 'Commercial Bank', owner: 'Joan Wanjiku', serviceLineFit: '["Investment & Transaction","Data & Digital"]' },
    { name: 'Britam Insurance', type: 'Insurance', owner: 'Dennis Nderitu', serviceLineFit: '["Investment & Transaction","Climate Risk & Adaptation"]' },
    { name: 'Jubilee Insurance', type: 'Insurance', owner: 'Howard Piwang', serviceLineFit: '["Investment & Transaction","Climate Risk & Adaptation"]' },
    { name: 'IRENA', type: 'Multilateral', owner: 'Leslie Igiraneza', serviceLineFit: '["Clean Energy Transition","Programme Design"]' },
    { name: 'Sida', type: 'Bilateral', owner: 'Dennis Nderitu', serviceLineFit: '["Climate Risk & Adaptation","Programme Design"]' },
  ];

  const createdOrgs: Record<string, string> = {};
  for (const o of orgs) {
    const org = await prisma.organization.upsert({
      where: { name: o.name },
      update: {},
      create: {
        name: o.name,
        type: o.type,
        relationshipOwnerId: createdUsers[o.owner],
        serviceLineFit: o.serviceLineFit,
        relationshipStatus: 'Warming',
        lastTouchpointDate: new Date(Date.now() - Math.random() * 30 * 86400000),
      },
    });
    createdOrgs[o.name] = org.id;
  }

  // Seed some sample opportunities
  const now = new Date();
  const opps = [
    { name: 'CIFF Phase 2 Energy Advisory', org: 'CIFF', sl: 'Clean Energy Transition', value: 450000, prob: 50, stage: 'Proposal Submitted', owner: 'Evans Kayo', enabler: 'Sharon Nyongesa', source: 'Existing Client', agent: false },
    { name: 'FSD Africa Digital Finance Platform', org: 'FSD Africa', sl: 'Data & Digital', value: 320000, prob: 30, stage: 'Discovery Meeting', owner: 'Evans Kayo', enabler: 'James Kanyiri', source: 'Existing Relationship', agent: true },
    { name: 'GIZ Clean Cooking Advisory', org: 'GIZ Kenya', sl: 'Clean Energy Transition', value: 280000, prob: 40, stage: 'Proposal Development', owner: 'Dennis Nderitu', enabler: 'Mohammed Gudle', source: 'Procurement Portal', agent: false },
    { name: 'AfDB Grid Integration Study', org: 'AfDB', sl: 'Clean Energy Transition', value: 520000, prob: 70, stage: 'Negotiation', owner: 'Howard Piwang', enabler: 'Felix Kuria', source: 'Procurement Portal', agent: false },
    { name: 'GEAPP Mini-Grid AI Agent', org: 'GEAPP', sl: 'Data & Digital', value: 180000, prob: 20, stage: 'Initial Contact', owner: 'Leslie Igiraneza', enabler: 'Amos Wanene', source: 'Referral', agent: true },
    { name: 'Rockefeller Climate Risk Assessment', org: 'Rockefeller Foundation', sl: 'Climate Risk & Adaptation', value: 350000, prob: 30, stage: 'Discovery Meeting', owner: 'Leslie Igiraneza', enabler: 'Felix Kuria', source: 'Existing Relationship', agent: false },
    { name: 'SE4ALL Energy Data Platform', org: 'SE4ALL', sl: 'Data & Digital', value: 200000, prob: 10, stage: 'Lead Identified', owner: 'Wilson Mungai', enabler: 'Julian Tanui', source: 'LinkedIn Outreach', agent: true },
    { name: 'Enabel Programme Design', org: 'Enabel', sl: 'Programme Design', value: 400000, prob: 40, stage: 'Proposal Development', owner: 'Joan Wanjiku', enabler: 'Mohammed Gudle', source: 'Procurement Portal', agent: false },
    { name: 'FCDO Blended Finance Advisory', org: 'FCDO / BII', sl: 'Investment & Transaction', value: 600000, prob: 50, stage: 'Proposal Submitted', owner: 'Dennis Nderitu', enabler: 'Sharon Nyongesa', source: 'Existing Relationship', agent: false },
    { name: 'Equity Bank AI Lending Agent', org: 'Equity Bank', sl: 'Data & Digital', value: 150000, prob: 20, stage: 'Initial Contact', owner: 'Wilson Mungai', enabler: 'James Kanyiri', source: 'Cold Outreach', agent: true },
    { name: 'Strathmore Energy Lab Partnership', org: 'Strathmore University', sl: 'Clean Energy Transition', value: 85000, prob: 70, stage: 'Negotiation', owner: 'Evans Kayo', enabler: 'Amos Wanene', source: 'Existing Relationship', agent: false },
    { name: 'KCB Green Finance Advisory', org: 'KCB Group', sl: 'Investment & Transaction', value: 220000, prob: 10, stage: 'Lead Identified', owner: 'Joan Wanjiku', enabler: null, source: 'Referral', agent: false },
    { name: 'IRENA Renewable Energy Programme', org: 'IRENA', sl: 'Programme Design', value: 480000, prob: 30, stage: 'Discovery Meeting', owner: 'Leslie Igiraneza', enabler: 'Mohammed Gudle', source: 'Procurement Portal', agent: false },
    { name: 'Britam Climate Insurance Product', org: 'Britam Insurance', sl: 'Climate Risk & Adaptation', value: 175000, prob: 40, stage: 'Proposal Development', owner: 'Dennis Nderitu', enabler: 'Felix Kuria', source: 'Existing Relationship', agent: false },
    { name: 'World Bank ESMAP Technical Assistance', org: 'World Bank ESMAP', sl: 'Clean Energy Transition', value: 700000, prob: 50, stage: 'Proposal Submitted', owner: 'Howard Piwang', enabler: 'Sharon Nyongesa', source: 'Procurement Portal', agent: false },
    { name: 'AfCEN Platform Enhancement', org: 'AfCEN', sl: 'Data & Digital', value: 120000, prob: 100, stage: 'Contract Signed', owner: 'Evans Kayo', enabler: 'Amos Wanene', source: 'Existing Client', agent: true, won: true },
    { name: 'Sida Climate Adaptation Study', org: 'Sida', sl: 'Climate Risk & Adaptation', value: 300000, prob: 0, stage: 'Lost', owner: 'Dennis Nderitu', enabler: 'Felix Kuria', source: 'Procurement Portal', agent: false, lost: true },
    { name: 'Jubilee TCFD Compliance', org: 'Jubilee Insurance', sl: 'Climate Risk & Adaptation', value: 130000, prob: 50, stage: 'On Hold', owner: 'Howard Piwang', enabler: null, source: 'Existing Relationship', agent: false },
  ];

  let oppCounter = 1;
  for (const o of opps) {
    const displayId = `OPP-20260413-${String(oppCounter).padStart(3, '0')}`;
    const daysBack = Math.floor(Math.random() * 30) + 5;
    const stageEntered = new Date(now.getTime() - daysBack * 86400000);
    await prisma.opportunity.upsert({
      where: { displayId },
      update: {},
      create: {
        displayId,
        name: o.name,
        organizationId: createdOrgs[o.org],
        serviceLine: o.sl,
        hasAgentComponent: o.agent,
        estimatedValue: o.value,
        probability: o.prob,
        stage: o.stage,
        stageEnteredAt: stageEntered,
        ownerId: createdUsers[o.owner],
        enablerId: o.enabler ? createdUsers[o.enabler] : null,
        sourceChannel: o.source,
        nextAction: 'Follow up with client',
        nextActionDate: new Date(now.getTime() + (Math.random() * 14 - 7) * 86400000),
        expectedCloseDate: new Date(now.getTime() + Math.random() * 90 * 86400000),
        actualCloseDate: (o as any).won ? new Date(now.getTime() - 5 * 86400000) : null,
        winLossReason: (o as any).won ? 'Strong existing relationship and platform expertise' : (o as any).lost ? 'Lost to competitor on pricing' : '',
      },
    });
    oppCounter++;
  }

  // Seed demos
  const demos = [
    { name: 'Lovelace — WhatsApp Accounting Agent', owner: 'Sharon Nyongesa', status: 'LIVE', url: 'https://lovelace-demo.bayesconsulting.com' },
    { name: 'Generic AI Agent — Conversational', owner: 'James Kanyiri', status: 'LIVE', url: 'https://agent-demo.bayesconsulting.com' },
    { name: 'AfCEN Energy Data Platform', owner: 'Amos Wanene', status: 'LIVE', url: 'https://afcen-demo.bayesconsulting.com' },
    { name: 'Climate Risk Dashboard', owner: 'Felix Kuria', status: 'In Progress', url: '' },
    { name: 'eTIMS Invoice Processing Agent', owner: 'Julian Tanui', status: 'LIVE', url: 'https://etims-demo.bayesconsulting.com' },
    { name: 'Capabilities Presentation Deck', owner: 'Naima Yusuf', status: 'LIVE', url: '' },
  ];

  for (const d of demos) {
    await prisma.demo.create({
      data: {
        name: d.name,
        ownerId: createdUsers[d.owner],
        status: d.status,
        lastTestedDate: new Date(now.getTime() - Math.random() * 7 * 86400000),
        url: d.url,
        demoDataCurrent: d.status === 'LIVE',
        videoRecorded: d.status === 'LIVE' ? 'Yes — Published' : 'No',
      },
    });
  }

  // Seed some activities
  const activityTypes = ['Outbound Email', 'Outbound Call', 'LinkedIn Message', 'Client Meeting (Virtual)', 'Client Meeting (In-Person)', 'Proposal Writing', 'Demo Delivered', 'Procurement Portal Scan', 'Event/Conference', 'Referral Made'];
  const userNames = Object.keys(createdUsers);
  const orgNames = Object.keys(createdOrgs);
  for (let i = 0; i < 80; i++) {
    const userName = userNames[Math.floor(Math.random() * userNames.length)];
    const orgName = orgNames[Math.floor(Math.random() * orgNames.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    await prisma.activity.create({
      data: {
        date: new Date(now.getTime() - daysAgo * 86400000),
        userId: createdUsers[userName],
        activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        organizationId: createdOrgs[orgName],
        description: `${activityTypes[Math.floor(Math.random() * activityTypes.length)]} with ${orgName} regarding ongoing engagement.`,
      },
    });
  }

  // Seed weekly scores for last 4 weeks
  for (const userName of userNames) {
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(now.getTime() - (w * 7 + now.getDay()) * 86400000);
      weekStart.setHours(0, 0, 0, 0);
      const user = users.find(u => u.name === userName)!;
      const isCloser = user.tier === 'Closer';
      const isHunter = user.tier === 'Hunter';
      const isEnabler = user.tier === 'Enabler';
      await prisma.weeklyScore.create({
        data: {
          userId: createdUsers[userName],
          weekStart,
          opportunitiesFlagged: Math.floor(Math.random() * (isCloser ? 4 : isHunter ? 2 : 1)),
          outboundContacts: Math.floor(Math.random() * (isCloser ? 15 : isHunter ? 5 : 1)),
          clientMeetings: Math.floor(Math.random() * (isCloser ? 4 : isHunter ? 2 : 1)),
          proposalsContributed: Math.random() * (isCloser ? 2 : isHunter ? 1 : 0.5),
          demosRun: Math.floor(Math.random() * (isEnabler ? 3 : 1)),
          materialsCreated: Math.floor(Math.random() * (isEnabler ? 3 : 1)),
          videosRecorded: Math.floor(Math.random() * (isEnabler ? 2 : 0)),
          caseStudiesWritten: 0,
          portalScans: isHunter ? Math.floor(Math.random() * 5) : 0,
          totalScore: Math.floor(Math.random() * 40) + 10,
        },
      });
    }
  }

  console.log('✅ Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
