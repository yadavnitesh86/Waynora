import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { Button, PageHeader, VisuallyHidden } from "../components/ui";

export default function Landing() {
  useDocumentTitle("Waynora", "AI trip planning — tell us where you want to go", {
    skipTitleSuffix: true,
  });

  return (
    <div className="flex min-h-[80vh] items-center px-md py-3xl">
      <div className="mx-auto w-full max-w-container-xl">
        {/* Phase 5 replaces this with the editorial landing page (D-13) */}
        <PageHeader
          eyebrow="AI trip planning"
          title="Plan a trip worth the wait."
          lede="Tell us where you want to go. A real agent builds your itinerary — usually in 5 to 15 minutes."
          actions={
            <>
              <Button asChild>
                <Link to="/signup">Create your free account</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/signin">Sign in</Link>
              </Button>
            </>
          }
        />
        {/* Honest status for assistive-technology users: the product is in
            early access, so nothing here should imply a finished experience. */}
        <VisuallyHidden>
          <p>
            Waynora is in early access. Trip generation and saved itineraries
            are not available yet.
          </p>
        </VisuallyHidden>
      </div>
    </div>
  );
}
