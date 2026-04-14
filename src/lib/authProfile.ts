import { Profile, User } from '@prisma/client';
import { prisma } from './prisma';
import { SessionUser } from './auth';

function normalizeRole(role: string) {
  if (['admin', 'manager', 'team_member', 'viewer'].includes(role)) return role;
  return 'team_member';
}

function normalizeTier(tier: string) {
  if (['Closer', 'Hunter', 'Enabler'].includes(tier)) return tier;
  return 'Enabler';
}

export async function ensureLegacyUserForProfile(profile: Profile) {
  if (profile.legacyUserId) {
    const user = await prisma.user.findUnique({ where: { id: profile.legacyUserId } });
    if (user) {
      return user;
    }
  }

  const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
  if (byEmail) {
    const updated = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        name: profile.fullName,
        email: profile.email,
        role: normalizeRole(profile.role),
        tier: normalizeTier(profile.tier),
        department: profile.department,
        title: profile.title,
        targetsAssigned: profile.targetsAssigned,
        isActive: profile.isActive && profile.approvalStatus === 'approved',
      },
    });

    await prisma.profile.update({
      where: { id: profile.id },
      data: { legacyUserId: byEmail.id },
    });

    return updated;
  }

  const created = await prisma.user.create({
    data: {
      name: profile.fullName,
      email: profile.email,
      passwordHash: '',
      role: normalizeRole(profile.role),
      tier: normalizeTier(profile.tier),
      department: profile.department,
      title: profile.title,
      targetsAssigned: profile.targetsAssigned,
      isActive: profile.isActive && profile.approvalStatus === 'approved',
      themePref: 'dark',
    },
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: { legacyUserId: created.id },
  });

  return created;
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tier: user.tier,
    department: user.department,
    title: user.title,
    avatarUrl: user.avatarUrl,
    themePref: user.themePref,
  };
}
