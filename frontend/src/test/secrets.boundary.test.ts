import { describe, expect, it } from "vitest";
import { env } from "../lib/env";
import {
  conversationSchema,
  messageSchema,
  cookieEnvelopeSchema,
  type Conversation,
} from "../lib/cookie/schema";
import { encodeEnvelope } from "../lib/cookie/codec";

describe("Secrets & Credential Boundary Hardening (QUAL-01, QUAL-03)", () => {
  describe("Client environment boundaries", () => {
    it("exposes only the two contracted public client env keys", () => {
      const exportedKeys = Object.keys(env).sort();
      expect(exportedKeys).toEqual(["VITE_API_BASE_URL", "VITE_CONVEX_URL"]);
    });

    it("does not expose private keys, secrets, or deployment tokens in client env", () => {
      const FORBIDDEN_SUBSTRINGS = [
        "DEPLOY_KEY",
        "PRIVATE_KEY",
        "JWT_PRIVATE",
        "SECRET",
        "ADMIN_KEY",
        "DATABASE_URL",
        "API_KEY",
      ];

      const clientEnvRecord = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};

      for (const [key, value] of Object.entries(clientEnvRecord)) {
        for (const forbidden of FORBIDDEN_SUBSTRINGS) {
          expect(
            key.toUpperCase().includes(forbidden),
            `Sensitive environment variable name leaked to client: ${key}`,
          ).toBe(false);

          if (typeof value === "string") {
            expect(
              value.includes("eyJ") && value.length > 50,
              `JWT/bearer token format detected in env value for: ${key}`,
            ).toBe(false);
          }
        }
      }
    });
  });

  describe("Cookie storage credential isolation", () => {
    it("strictly rejects message schemas containing injected credential or auth fields", () => {
      const injectedMessage = {
        id: "msg-test",
        role: "user",
        content: "Where should we go?",
        createdAt: "2026-10-15T10:00:00.000Z",
        authToken: "bearer_xyz_12345",
        password: "SuperSecretPassword123",
      };

      const parseResult = messageSchema.safeParse(injectedMessage);
      expect(parseResult.success).toBe(false);
    });

    it("strictly rejects conversation schemas containing injected auth tokens or API keys", () => {
      const injectedConversation = {
        id: "convo-test",
        title: "Test Trip",
        createdAt: "2026-10-15T10:00:00.000Z",
        updatedAt: "2026-10-15T10:00:00.000Z",
        messages: [],
        apiKey: "sk-proj-1234567890",
        sessionToken: "sess_secret_abcdef",
      };

      const parseResult = conversationSchema.safeParse(injectedConversation);
      expect(parseResult.success).toBe(false);
    });

    it("strictly rejects cookie envelope schemas containing extraneous secret metadata", () => {
      const injectedEnvelope = {
        version: 1,
        conversations: [],
        convexDeployKey: "prod_deploy_secret",
      };

      const parseResult = cookieEnvelopeSchema.safeParse(injectedEnvelope);
      expect(parseResult.success).toBe(false);
    });

    it("serializes only clean conversational data without leaking credentials or tokens", () => {
      const validConvo: Conversation = {
        id: "convo-101",
        title: "Kyoto Itinerary",
        createdAt: "2026-10-15T10:00:00.000Z",
        updatedAt: "2026-10-15T10:00:00.000Z",
        threadId: "thread-abc-xyz",
        messages: [
          {
            id: "msg-101",
            role: "user",
            content: "Looking for traditional tea houses in Kyoto",
            createdAt: "2026-10-15T10:00:00.000Z",
          },
        ],
      };

      const { index, chunks } = encodeEnvelope({
        version: 1,
        conversations: [validConvo],
      });

      const combinedSerialized = index + chunks.join("");
      expect(combinedSerialized).not.toContain("password");
      expect(combinedSerialized).not.toContain("authToken");
      expect(combinedSerialized).not.toContain("bearer");
      expect(combinedSerialized).not.toContain("sk-");
      expect(combinedSerialized).not.toContain("CONVEX_DEPLOY_KEY");
      expect(combinedSerialized).not.toContain("JWT_PRIVATE");
    });
  });
});
