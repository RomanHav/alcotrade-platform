import Image from 'next/image';
import SignInForm from './SignInForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SP = Record<string, string | string[] | undefined>;

function isSP(v: unknown): v is SP {
  if (!v || typeof v !== 'object') return false;

  return Object.values(v as Record<string, unknown>).every(
    (val) =>
      typeof val === 'string' ||
      (Array.isArray(val) && val.every((x) => typeof x === 'string')) ||
      typeof val === 'undefined',
  );
}

export default async function Page({ searchParams }: { searchParams?: Promise<unknown> }) {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const maybe = (await searchParams) ?? {};
  const sp: SP = isSP(maybe) ? maybe : {};
  const raw = sp['callbackUrl'];
  const callbackUrl = Array.isArray(raw) ? (raw[0] ?? '/dashboard') : raw || '/dashboard';

  return (
    <div className="flex w-full flex-col items-center gap-24 p-5">
      <div className="relative h-[166px] w-[250px]">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={250}
          height={166}
          className="block dark:hidden"
          priority
        />

        <Image
          src="/dark-logo.svg"
          alt="Logo dark"
          width={250}
          height={166}
          className="hidden h-auto w-auto dark:block"
          priority
        />
      </div>

      <SignInForm callbackUrl={callbackUrl} />
    </div>
  );
}
