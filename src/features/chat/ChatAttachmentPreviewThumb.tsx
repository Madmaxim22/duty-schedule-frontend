type Props = {
  url: string;
  isVideo?: boolean;
  posterUrl?: string;
};

export function ChatAttachmentPreviewThumb({ url, isVideo = false, posterUrl }: Props) {
  if (isVideo) {
    return (
      <div className="chat-room__attachment-preview-media chat-room__attachment-preview-media--video">
        <video
          src={url}
          poster={posterUrl}
          muted
          playsInline
          preload="metadata"
          className="chat-room__attachment-preview-img"
        />
        <span className="chat-room__attachment-preview-play" aria-hidden>
          ▶
        </span>
      </div>
    );
  }

  return <img src={url} alt="" className="chat-room__attachment-preview-img" />;
}
