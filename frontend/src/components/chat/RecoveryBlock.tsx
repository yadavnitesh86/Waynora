import type { ReactNode } from "react";

export interface RecoveryBlockProps {
  kind: string;
  onRetry: () => void;
  children?: ReactNode;
}

export default function RecoveryBlock() {
  return null;
}
