import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";

import { getSystemSettingsAction } from "@/features/admin/settings/actions/settings-queries";
import { SettingsForm } from "@/features/admin/settings/components/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettingsAction();

  return (
    <PageContainer className="max-w-3xl">
      <SectionHeader
        title="Settings"
        description="Platform-wide configuration. Changes apply immediately."
        breadcrumbs={[{ label: "Settings" }]}
        breadcrumbsHomeHref="/admin"
      />

      <SettingsForm settings={settings} />
    </PageContainer>
  );
}
