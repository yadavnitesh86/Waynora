import { useState, useCallback } from "react";
import { useAskController } from "../hooks/useAskController";
import {
  readConversations,
  writeConversations,
} from "../lib/cookie/repository";
import {
  createConversation,
  createMessage,
  deriveTitle,
  markInFlight,
  addMessage,
} from "../lib/chat/domain";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import type { Conversation } from "../lib/cookie/schema";
import { EmptyState } from "../components/ui";
import ChatComposer from "../components/chat/ChatComposer";
import UserMessage from "../components/chat/UserMessage";
import AssistantMessage from "../components/chat/AssistantMessage";
import StorageNotice from "../components/chat/StorageNotice";

export default function Chat() {
  useDocumentTitle("Chat", "Your trip planning chat");

  const [conversation, setConversation] = useState<Conversation>(() => {
    const result = readConversations();
    const first = result.conversations[0];
    if (first) return first;
    return createConversation("local", new Date().toISOString());
  });

  const [showStorageNotice, setShowStorageNotice] = useState(false);

  const { status, submit } = useAskController({
    conversationId: conversation.id,
  });

  const busy = status.kind === "submitting" || status.kind === "waiting";
  const hasMessages = conversation.messages.length > 0;

  const handleSubmit = useCallback(
    (text: string) => {
      if (!submit) return;

      const now = new Date().toISOString();
      const msgId = crypto.randomUUID();
      const msg = createMessage(msgId, "user", text, now);

      const withMessage = addMessage(conversation, msg);
      const withInFlight = markInFlight(withMessage, msgId, now);
      const updated = {
        ...withInFlight,
        title: deriveTitle(withInFlight.messages),
      };

      setConversation(updated);

      const writeResult = writeConversations([updated]);
      if (writeResult.evicted.includes(conversation.id)) {
        setShowStorageNotice(true);
      }

      submit({
        conversationId: conversation.id,
        messageId: msgId,
        question: text,
        threadId: conversation.threadId,
      });
    },
    [conversation, submit],
  );

  return (
    <div className="mx-auto w-full max-w-container-xl px-md py-3xl">
      {!hasMessages ? (
        <EmptyState
          title="Where do you want to go?"
          body="Describe your trip in your own words. A real agent builds the plan, usually in 5 to 15 minutes. Your chat stays in this browser."
        />
      ) : (
        <div className="mb-lg">
          {conversation.messages.map((msg) => {
            if (msg.role === "user") {
              return <UserMessage key={msg.id} message={msg} />;
            }
            return <AssistantMessage key={msg.id} message={msg} />;
          })}
        </div>
      )}

      {showStorageNotice && <StorageNotice />}

      <ChatComposer onSubmit={handleSubmit} busy={busy} />
    </div>
  );
}
