import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  href?: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function Logo({ href = '/', className = '', width = 150, height = 50 }: LogoProps) {
  const logoContent = (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/FusionAuraLogo.png"
        alt="FusionAura Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

