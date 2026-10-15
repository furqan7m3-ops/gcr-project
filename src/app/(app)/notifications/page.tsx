import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { NotificationCenter } from "@/features/notifications/components/notification-center";
import {
  getNotifications,
  markAllNotificationsReadOnOpen,
} from "@/features/notifications/queries/notification-queries";

export default async function NotificationsPage() {
  // Opening this page counts as reading everything - no manual "mark all read"
  // needed, and the sidebar dot / bell badge clear as soon as it's opened.
  await markAllNotificationsReadOnOpen();
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
