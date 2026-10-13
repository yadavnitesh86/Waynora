import type { Message } from "../../lib/cookie/schema";

export interface UserMessageProps {
  message: Message;
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="mb-md rounded-md bg-surface-raised px-md py-sm">
      {message.content}
    </div>
  );
}
