'use client';

interface AuthToastProps {
  message: string;
  tone?: 'success' | 'error';
}

export default function AuthToast({ message, tone = 'success' }: AuthToastProps) {
  return (
    <div
      className="fixed right-4 top-4 z-50 px-4 py-2 rounded-lg text-sm shadow-xl"
      style={{
        background: tone === 'success' ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
        border: `1px solid ${tone === 'success' ? 'rgba(39,174,96,0.35)' : 'rgba(231,76,60,0.35)'}`,
        color: tone === 'success' ? '#27AE60' : '#E74C3C',
      }}
    >
      {message}
    </div>
  );
}
