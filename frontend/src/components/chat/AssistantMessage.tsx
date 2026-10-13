import type { Message } from "../../lib/cookie/schema";

export interface AssistantMessageProps {
  message: Message;
}

export default function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="mb-md rounded-md bg-surface px-md py-sm">
      {message.content}
    </div>
  );
}
