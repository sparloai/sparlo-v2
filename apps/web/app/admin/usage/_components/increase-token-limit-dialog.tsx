'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  ADJUSTMENT_REASONS,
  increaseTokenLimitAction,
} from '@kit/admin/lib/server/admin-usage-actions';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { toast } from '@kit/ui/sonner';
import { Textarea } from '@kit/ui/textarea';

const formSchema = z
  .object({
    additionalTokens: z.coerce
      .number()
      .int('Must be a whole number')
      .min(1, 'Must add at least 1 token')
      .max(10_000_000, 'Cannot add more than 10M tokens'),
    reasonType: z.enum([
      'error_refund',
      'upgrade_bonus',
      'support_request',
      'other',
    ]),
    reasonDetails: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      data.reasonType !== 'other' ||
      (data.reasonDetails && data.reasonDetails.length >= 10),
    {
      message: 'Please provide details when selecting "Other"',
      path: ['reasonDetails'],
    },
  );

interface Props {
  accountId: string;
  currentLimit: number;
  tokensUsed: number;
  userEmail: string;
  onSuccess: () => void;
}

export function IncreaseTokenLimitDialog({
  accountId,
  currentLimit,
  tokensUsed,
  userEmail,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      additionalTokens: undefined,
      reasonType: 'error_refund',
      reasonDetails: '',
    },
  });

  const additionalTokens = form.watch('additionalTokens') || 0;
  const reasonType = form.watch('reasonType');
  const newLimit = currentLimit + additionalTokens;

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const result = await increaseTokenLimitAction({
        accountId,
        additionalTokens: data.additionalTokens,
        reasonType: data.reasonType,
        reasonDetails: data.reasonDetails,
      });

      toast.success('Token limit updated', {
        description: `Increased from ${result.oldLimit.toLocaleString()} to ${result.newLimit.toLocaleString()} tokens`,
      });

      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error('Failed to update token limit', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Increase Token Limit
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Increase Token Limit</DialogTitle>
          <DialogDescription>
            Add tokens to {userEmail}&apos;s current billing period.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Status */}
            <div className="bg-muted rounded-md p-3 text-sm">
              <div className="flex justify-between">
                <span>Current Limit:</span>
                <span className="font-medium">
                  {currentLimit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tokens Used:</span>
                <span className="font-medium">
                  {tokensUsed.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2">
                <span>New Limit:</span>
                <span className="font-bold text-green-600">
                  {newLimit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Token Amount */}
            <FormField
              name="additionalTokens"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Tokens</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Common: 10,000 (error refund), 50,000 (upgrade bonus)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason Type */}
            <FormField
              name="reasonType"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADJUSTMENT_REASONS.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason Details (required for "other", optional otherwise) */}
            <FormField
              name="reasonDetails"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Additional Details{' '}
                    {reasonType === 'other' ? '(required)' : '(optional)'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Ticket #1234 - API timeout during report generation"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Confirm Increase
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
