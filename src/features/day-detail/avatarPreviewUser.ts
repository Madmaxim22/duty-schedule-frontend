export type AvatarPreviewUser = {
  targetUserId: string;
  photoId: string;
  fullName: string;
  avatarUrl: string;
};

export function toAvatarPreviewUser(user: {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentPhotoId: string | null;
}): AvatarPreviewUser | null {
  if (!user.avatarUrl || !user.currentPhotoId) return null;
  return {
    targetUserId: user.id,
    photoId: user.currentPhotoId,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  };
}
