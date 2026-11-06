export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand" aria-hidden />
        <p className="text-sm text-gray-600">読み込み中…</p>
      </div>
    </div>
  )
}
