import Image from 'next/image';
import Link from 'next/link';

import { AuthLayoutShell } from '@kit/auth/shared';

function AuthLogo() {
  return (
    <Link href="/" className="transition-opacity hover:opacity-80">
      <Image
        src="/images/sparlo-logo.png"
        alt="Sparlo"
        width={90}
        height={24}
        className="h-6 w-auto"
        priority
      />
    </Link>
  );
}

function AuthLayout({ children }: React.PropsWithChildren) {
  return <AuthLayoutShell Logo={AuthLogo}>{children}</AuthLayoutShell>;
}

export default AuthLayout;
