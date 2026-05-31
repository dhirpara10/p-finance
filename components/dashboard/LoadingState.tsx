export function LoadingState() {
  return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">Loading Finance Data...</p>
          <p className="mt-2 text-sm text-neutral-500">
            Syncing with Google Sheets
          </p>
        </div>
      </main>
  );
}
