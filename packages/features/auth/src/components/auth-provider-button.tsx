import { OauthProviderLogoImage } from '@kit/ui/oauth-provider-logo-image';

export function AuthProviderButton({
  providerId,
  onClick,
  children,
}: React.PropsWithChildren<{
  providerId: string;
  onClick: () => void;
}>) {
  return (
    <button
      className="flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white text-[15px] font-medium text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 active:scale-[0.98]"
      data-provider={providerId}
      data-test="auth-provider-button"
      onClick={onClick}
      type="button"
    >
      <OauthProviderLogoImage providerId={providerId} />
      <span>{children}</span>
    </button>
  );
}
