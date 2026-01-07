'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  type AdminUserSearchResult,
  searchUserByEmailAction,
} from '@kit/admin/lib/server/admin-usage-actions';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Progress } from '@kit/ui/progress';
import { Separator } from '@kit/ui/separator';

import { IncreaseTokenLimitDialog } from './increase-token-limit-dialog';

const searchSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export function AdminUsageSearch() {
  const [results, setResults] = useState<AdminUserSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: z.infer<typeof searchSchema>) => {
    setError(null);
    try {
      const response = await searchUserByEmailAction(data);
      setResults(response.users);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    }
  };

  const handleAdjustmentSuccess = () => {
    // Re-run search to get fresh data
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search User by Email</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter user email address..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Search</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No Results */}
      {searched && results.length === 0 && !error && (
        <Alert>
          <AlertDescription>
            No users found with that email address.
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {results.map((user) => (
        <UserCard
          key={user.account_id}
          user={user}
          onSuccess={handleAdjustmentSuccess}
        />
      ))}
    </div>
  );
}

function UserCard({
  user,
  onSuccess,
}: {
  user: AdminUserSearchResult;
  onSuccess: () => void;
}) {
  const usagePercent =
    user.tokens_limit > 0
      ? Math.min(100, (user.tokens_used / user.tokens_limit) * 100)
      : 0;

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    trialing: 'bg-blue-500',
    past_due: 'bg-amber-500',
    canceled: 'bg-red-500',
    none: 'bg-gray-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{user.email}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {user.account_name}
            {user.is_personal_account && ' (Personal)'}
          </p>
        </div>
        <Badge
          className={statusColors[user.subscription_status] ?? 'bg-gray-500'}
        >
          {user.subscription_status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Token Usage</span>
            <span className="font-medium">
              {user.tokens_used.toLocaleString()} /{' '}
              {user.tokens_limit.toLocaleString()}
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <p className="text-muted-foreground text-xs">
            {usagePercent.toFixed(1)}% used
            {user.period_end && (
              <>
                {' '}
                &middot; Resets{' '}
                {formatDistanceToNow(new Date(user.period_end), {
                  addSuffix: true,
                })}
              </>
            )}
          </p>
        </div>

        <Separator />

        {/* IDs for debugging */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Account ID</span>
            <p className="font-mono text-xs">{user.account_id}</p>
          </div>
          <div>
            <span className="text-muted-foreground">User ID</span>
            <p className="font-mono text-xs">{user.user_id}</p>
          </div>
        </div>

        <Separator />

        {/* Action */}
        <div className="flex justify-end">
          <IncreaseTokenLimitDialog
            accountId={user.account_id}
            currentLimit={user.tokens_limit}
            tokensUsed={user.tokens_used}
            userEmail={user.email}
            onSuccess={onSuccess}
          />
        </div>
      </CardContent>
    </Card>
  );
}
