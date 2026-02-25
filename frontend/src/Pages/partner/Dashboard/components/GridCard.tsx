
export default function GridCard({ title, value }: {title: string; value: string | number}) {
  return (
    <div className="bg-[#151820]/70 rounded-lg p-4 flex flex-col items-center justify-center">
      <h3 className="text-sm text-gray-400">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
