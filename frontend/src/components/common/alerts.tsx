// Composant Loading Skeleton
export function SkeletonLoader() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </div>
  );
}

// Composant Loading
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Composant Empty State
export function EmptyState({ message = 'Aucune données trouvée' }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

// Composant Error Alert
export function ErrorAlert({ error, onClose }: { error: string; onClose?: () => void }) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-red-800 hover:text-red-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// Composant Success Alert
export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-green-50 p-4">
      <h3 className="text-sm font-medium text-green-800">{message}</h3>
    </div>
  );
}
