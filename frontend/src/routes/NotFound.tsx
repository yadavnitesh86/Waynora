import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { Button, PageHeader } from "../components/ui";

export default function NotFound() {
  useDocumentTitle("Page not found", "We couldn't find that page.");

  return (
    <div className="flex min-h-[80vh] items-center px-md py-3xl">
      <div className="mx-auto w-full max-w-container-xl">
        <PageHeader
          title="Page not found"
          lede="We couldn't find that page. Head back home to start a trip."
          actions={
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
