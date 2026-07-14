import Link from "next/link";
import { KeyRound, LockKeyhole, ShieldAlert, Users } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { StatGrid } from "@/components/page/dashboard-grid";
import { SectionHeader } from "@/components/page/section-header";
import { StatCard } from "@/components/page/stat-card";
import { Card, CardContent } from "@/components/ui/card";

import { getSecurityOverviewAction } from "@/features/admin/security/actions/security-queries";
import { AccountStatusPanel } from "@/features/admin/security/components/account-status-panel";
import { PasswordPolicyCard } from "@/features/admin/security/components/password-policy-card";

export default async function AdminSecurityPage() {
  const overview = await getSecurityOverviewAction();

  return (
    <PageContainer>
      <SectionHeader
        title="Security"
        description="Active sessions, login activity, account lockouts, and password policy."
        breadcrumbs={[{ label: "Security" }]}
        breadcrumbsHomeHref="/admin"
      />

      <StatGrid>
        <StatCard label="Active sessions" value={overview.activeSessionCount} icon={Users} />
        <StatCard label="Locked accounts" value={overview.lockedAccountCount} icon={LockKeyhole} />
        <StatCard
          label="Failed attempts (24h)"
          value={overview.recentFailedAttemptCount}
          icon={ShieldAlert}
        />
        <StatCard
          label="Min. password length"
          value={overview.passwordPolicy.minPasswordLength}
          icon={KeyRound}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AccountStatusPanel items={overview.accountStatusBreakdown} />
        <PasswordPolicyCard policy={overview.passwordPolicy} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/admin/security/sessions">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground">Active sessions</p>
              <p className="text-sm text-muted-foreground">
                View and terminate signed-in sessions.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/security/failed-attempts">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground">Failed login attempts</p>
              <p className="text-sm text-muted-foreground">Recent unsuccessful sign-in attempts.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/security/locked-accounts">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground">Locked accounts</p>
              <p className="text-sm text-muted-foreground">
                Unlock accounts or force a password reset.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </PageContainer>
  );
}
