import { redirect } from 'next/navigation';

interface TeamAccountHomePageProps {
  params: Promise<{ account: string }>;
}

/**
 * Team accounts don't need a dashboard - redirect to billing page
 * which shows subscription status and usage information.
 */
async function TeamAccountHomePage({ params }: TeamAccountHomePageProps) {
  const account = (await params).account;

  redirect(`/home/${account}/billing`);
}

export default TeamAccountHomePage;
