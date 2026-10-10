import axe from "axe-core";

/** Impacts that fail the gate. Minor/moderate are reported but non-blocking. */
const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

export interface AxeViolationSummary {
  id: string;
  impact: string;
  help: string;
  /** CSS selector(s) of the offending node(s). */
  target: string;
}

function format(summary: AxeViolationSummary): string {
  return `[${summary.impact}] ${summary.id}: ${summary.help} (target: ${summary.target})`;
}

/**
 * Runs axe-core over `container` and throws for every `critical` or `serious`
 * violation. The full violation list is returned so callers can surface the
 * minor/moderate and best-practice findings without failing the gate.
 *
 * `color-contrast` is disabled here: it needs real computed layout, which jsdom
 * does not have (it cannot resolve the Tailwind stylesheet at all). Contrast
 * against the UI-SPEC palette is verified in the human browser pass and was
 * measured when the tokens were defined.
 */
export async function expectNoAxeViolations(
  container: HTMLElement,
): Promise<AxeViolationSummary[]> {
  const results = await axe.run(container, {
    resultTypes: ["violations"],
    rules: { "color-contrast": { enabled: false } },
  });

  const summaries: AxeViolationSummary[] = results.violations.map(
    (violation) => ({
      id: violation.id,
      impact: violation.impact ?? "unknown",
      help: violation.help,
      target: violation.nodes.map((node) => node.target.join(" ")).join(" | "),
    }),
  );

  const blocking = summaries.filter((summary) =>
    BLOCKING_IMPACTS.has(summary.impact),
  );

  if (blocking.length > 0) {
    throw new Error(
      `axe-core found ${blocking.length} critical/serious violation(s):\n` +
        blocking.map((summary) => `- ${format(summary)}`).join("\n"),
    );
  }

  return summaries;
}

export default expectNoAxeViolations;
