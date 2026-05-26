import type { ChatReactionSummary } from '@/shared/api/types';
import { Avatar } from '@/shared/ui/Avatar';

type Props = {
  reactions: ChatReactionSummary[];
  /** В пузыре: слева внизу, в одной строке с временем справа. */
  corner?: boolean;
  /** В direct — мини-аватар вместо счётчика. */
  isDirect?: boolean;
  onChipClick: (emoji: string, reactedByMe: boolean) => void;
};

export function ChatMessageReactions({
  reactions,
  corner = false,
  isDirect = false,
  onChipClick,
}: Props) {
  if (reactions.length === 0) return null;

  return (
    <div
      className={`chat-room__reactions${corner ? ' chat-room__reactions--corner' : ''}`}
      role="group"
      aria-label="Реакции"
    >
      {reactions.map((reaction) => {
        const reactors = reaction.reactors ?? [];
        const label = isDirect
          ? `${reaction.emoji}, ${reactors.map((r) => r.fullName).join(', ') || 'реакция'}`
          : `${reaction.emoji}, ${reaction.count}`;

        return (
          <button
            key={reaction.emoji}
            type="button"
            className={`chat-room__reaction-chip${reaction.reactedByMe ? ' chat-room__reaction-chip--mine' : ''}${
              isDirect ? ' chat-room__reaction-chip--direct' : ''
            }`}
            aria-label={label}
            onClick={(e) => {
              e.stopPropagation();
              onChipClick(reaction.emoji, reaction.reactedByMe);
            }}
          >
            <span className="chat-room__reaction-emoji" aria-hidden>
              {reaction.emoji}
            </span>
            {isDirect ? (
              <span className="chat-room__reaction-avatars" aria-hidden>
                {reactors.map((reactor) => (
                  <Avatar
                    key={reactor.id}
                    fullName={reactor.fullName}
                    avatarUrl={reactor.avatarUrl}
                    className="chat-room__reaction-avatar"
                  />
                ))}
              </span>
            ) : (
              <span className="chat-room__reaction-count">{reaction.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
