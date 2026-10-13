export default function StorageNotice() {
  return (
    <div
      role="status"
      className="mb-lg rounded-md bg-warning-subtle px-md py-sm text-sm"
    >
      <h3 className="font-semibold text-warning">
        This chat couldn&apos;t be saved.
      </h3>
      <p className="mt-2xs text-warning">
        Your browser&apos;s storage for Waynora is full. This conversation
        stays available until you close the tab, but it won&apos;t be here next
        time.
      </p>
    </div>
  );
}
