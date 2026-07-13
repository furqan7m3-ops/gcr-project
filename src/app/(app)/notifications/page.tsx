import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { NotificationCenter } from "@/features/notifications/components/notification-center";
import { getNotifications } from "@/features/notifications/queries/notification-queries";

export default async function NotificationsPage() {
  const initialPage = await getNotifications({ limit: 20, unreadOnly: false });

  return (
    <PageContainer>
      <SectionHeader
        title="Notifications"
        description="Updates from your classes, all in one place."
      />
      <NotificationCenter
        initialNotifications={initialPage.notifications}
        initialCursor={initialPage.nextCursor}
      />
    </PageContainer>
  );
}
