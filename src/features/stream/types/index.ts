export interface AnnouncementAttachmentSummary {
  id: string;
  fileName: string;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  isEdited: boolean;
  author: {
    name: string;
    image: string | null;
  };
  commentCount: number;
  attachments: AnnouncementAttachmentSummary[];
}
