import Image from 'next/image';

interface BrandLogoProps {
  theme: 'light' | 'dark';
  className?: string;
  priority?: boolean;
}

export default function BrandLogo({ theme, className, priority = false }: BrandLogoProps) {
  const logoSrc = theme === 'light' ? '/logos/bayes-logo-light.png' : '/logos/bayes-logo-dark.png';

  return (
    <Image
      src={logoSrc}
      alt="Bayes Consulting"
      width={523}
      height={171}
      priority={priority}
      className={className}
    />
  );
}
