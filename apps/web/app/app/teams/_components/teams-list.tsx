'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Users } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

import type { TeamAccount } from '../_lib/server/teams-page.loader';

interface TeamsListProps {
  teams: TeamAccount[];
}

export function TeamsList({ teams }: TeamsListProps) {
  if (teams.length === 0) {
    return (
      <Card className="rounded-xl border-zinc-200 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="mb-4 h-12 w-12 text-zinc-300" />
          <h3 className="mb-2 text-lg font-medium text-zinc-900">
            <Trans i18nKey="common:teams.noTeams" />
          </h3>
          <p className="mb-6 text-center text-zinc-500">
            <Trans i18nKey="common:teams.noTeamsDescription" />
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <Card
          key={team.id}
          className="rounded-xl border-zinc-200 shadow-sm transition-shadow hover:shadow-md"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              {team.pictureUrl ? (
                <Image
                  src={team.pictureUrl}
                  alt={team.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                  <Users className="h-5 w-5 text-zinc-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-base font-medium">
                  {team.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  <Trans
                    i18nKey="common:teams.memberCount"
                    values={{ count: team.memberCount }}
                  />
                </CardDescription>
              </div>
            </div>
            <Link href={`/home/${team.slug}/members`}>
              <Button variant="outline" size="sm">
                <Trans i18nKey="common:teams.manageMembers" />
              </Button>
            </Link>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
