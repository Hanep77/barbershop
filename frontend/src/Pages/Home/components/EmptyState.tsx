export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <svg
        className="w-20 h-20 text-gray-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">
        Barbershop Tidak Ditemukan
      </h3>
      <p className="text-gray-500 text-center max-w-sm">
        Coba ubah pencarian atau filter Anda untuk menemukan barbershop yang Anda cari
      </p>
    </div>
  );
}
