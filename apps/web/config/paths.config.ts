import { z } from 'zod';

const PathsSchema = z.object({
  auth: z.object({
    signIn: z.string().min(1),
    signUp: z.string().min(1),
    verifyMfa: z.string().min(1),
    callback: z.string().min(1),
    passwordReset: z.string().min(1),
    passwordUpdate: z.string().min(1),
  }),
  app: z.object({
    home: z.string().min(1),
    personalAccountSettings: z.string().min(1),
    personalAccountBilling: z.string().min(1),
    personalAccountBillingReturn: z.string().min(1),
    personalAccountBillingPortalReturn: z.string().min(1),
    personalAccountTeams: z.string().min(1),
    accountHome: z.string().min(1),
    accountSettings: z.string().min(1),
    accountBilling: z.string().min(1),
    accountMembers: z.string().min(1),
    accountBillingReturn: z.string().min(1),
    accountHelp: z.string().min(1),
    joinTeam: z.string().min(1),
  }),
});

const pathsConfig = PathsSchema.parse({
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    verifyMfa: '/auth/verify',
    callback: '/auth/callback',
    passwordReset: '/auth/password-reset',
    passwordUpdate: '/update-password',
  },
  app: {
    home: '/app',
    personalAccountSettings: '/app/settings',
    personalAccountBilling: '/app/billing',
    personalAccountBillingReturn: '/app/billing/return',
    personalAccountBillingPortalReturn: '/app/billing/portal-return',
    personalAccountTeams: '/app/teams',
    accountHome: '/app/[account]',
    accountSettings: '/app/[account]/settings',
    accountBilling: '/app/[account]/billing',
    accountMembers: '/app/[account]/members',
    accountBillingReturn: '/app/[account]/billing/return',
    accountHelp: '/app/[account]/help',
    joinTeam: '/app/join',
  },
} satisfies z.infer<typeof PathsSchema>);

export default pathsConfig;
