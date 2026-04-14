'use client';

function scorePassword(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

export default function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);

  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['#E74C3C', '#E67E22', '#F39C12', '#27AE60', '#16A34A'];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-1.5 flex-1 rounded"
            style={{
              background: index < score ? colors[score] : 'var(--color-border)',
            }}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px]" style={{ color: password ? colors[score] : 'var(--color-text-secondary)' }}>
        {password ? labels[score] : 'Password strength'}
      </p>
    </div>
  );
}
