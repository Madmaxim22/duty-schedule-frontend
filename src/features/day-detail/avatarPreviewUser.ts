export type AvatarPreviewUser = {
  targetUserId: string;
  photoId: string;
  fullName: string;
  avatarUrl: string;
  focusX: number;
  focusY: number;
};

export function toAvatarPreviewUser(user: {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentPhotoId: string | null;
  avatarFocusX?: number;
  avatarFocusY?: number;
}): AvatarPreviewUser | null {
  if (!user.avatarUrl || !user.currentPhotoId) return null;
  return {
    targetUserId: user.id,
    photoId: user.currentPhotoId,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    focusX: user.avatarFocusX ?? 50,
    focusY: user.avatarFocusY ?? 50,
  };
}
