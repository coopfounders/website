import type { ConversationSummary } from "../types";

interface Props {
  conversations: ConversationSummary[];
  activeId: string | null;
  open: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function Sidebar({ conversations, activeId, open, onSelect, onDelete, onNew }: Props) {
  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <button type="button" className="new-chat" onClick={onNew}>
        + New chat
      </button>
      <div className="conv-list">
        {conversations.map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            className={`conv-item${c.id === activeId ? " active" : ""}`}
            onClick={() => onSelect(c.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(c.id)}
          >
            <span className="title">{c.title}</span>
            <button
              type="button"
              className="delete"
              aria-label={`Delete "${c.title}"`}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${c.title}"?`)) onDelete(c.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <p style={{ padding: "0.5rem 0.6rem", fontSize: "0.8rem", color: "var(--muted)" }}>
            No conversations yet.
          </p>
        )}
      </div>
    </aside>
  );
}
