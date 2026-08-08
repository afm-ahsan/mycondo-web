import { ReactNode } from 'react';
import { setAccessToken } from '@/api/baseApi';
import { useLogout } from '@/features/auth/api/authApi';
import { clearPersistedTenantId } from '@/features/auth/lib/tenantSession';
import { I18N_LANGUAGES } from '@/i18n/config';
import { Language } from '@/i18n/types';
import { Globe, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sessionEnded } from '@/store/slices/authSlice';
import { useLanguage } from '@/providers/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [logoutMutation] = useLogout();
  const { currenLanguage, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const displayAvatar = toAbsoluteUrl('/media/avatars/300-2.png');

  async function logout() {
    try {
      await logoutMutation().unwrap();
    } finally {
      setAccessToken(null);
      clearPersistedTenantId();
      dispatch(sessionEnded());
      navigate('/login');
    }
  }

  const handleLanguage = (lang: Language) => {
    changeLanguage(lang);
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        {/* Header — plain identity display, not a link: MyCondo has no profile page of its own yet
            (see UX-6 UserDropdownMenu cleanup — the Metronic template's account/public-profile demo
            pages have no real backing, so this deliberately doesn't link to them). */}
        <div className="flex items-center gap-2 p-3">
          <img
            className="size-9 rounded-full border-2 border-green-500"
            src={displayAvatar}
            alt="User avatar"
          />
          <div className="flex flex-col">
            <span className="text-sm text-mono font-semibold">{displayName}</span>
            <a
              href={`mailto:${displayEmail}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {displayEmail}
            </a>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Language Submenu with Radio Group */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 [&_[data-slot=dropdown-menu-sub-trigger-indicator]]:hidden hover:[&_[data-slot=badge]]:border-input data-[state=open]:[&_[data-slot=badge]]:border-input">
            <Globe />
            <span className="flex items-center justify-between gap-2 grow relative">
              Language
              <Badge
                variant="outline"
                className="absolute end-0 top-1/2 -translate-y-1/2"
              >
                {currenLanguage.label}
                <img
                  src={currenLanguage.flag}
                  className="w-3.5 h-3.5 rounded-full"
                  alt={currenLanguage.label}
                />
              </Badge>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup
              value={currenLanguage.code}
              onValueChange={(value) => {
                const selectedLang = I18N_LANGUAGES.find(
                  (lang) => lang.code === value,
                );
                if (selectedLang) handleLanguage(selectedLang);
              }}
            >
              {I18N_LANGUAGES.map((item) => (
                <DropdownMenuRadioItem
                  key={item.code}
                  value={item.code}
                  className="flex items-center gap-2"
                >
                  <img
                    src={item.flag}
                    className="w-4 h-4 rounded-full"
                    alt={item.label}
                  />
                  <span>{item.label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Footer */}
        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={(event) => event.preventDefault()}
        >
          <Moon />
          <div className="flex items-center gap-2 justify-between grow">
            Dark Mode
            <Switch
              size="sm"
              checked={theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </DropdownMenuItem>
        <div className="p-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
