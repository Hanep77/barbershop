interface SearchServiceProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchService = ({ value, onChange }: SearchServiceProps) => {
  return (
    <div className="flex flex-row lg:w-lg w-full">
      <input
        type="text"
        placeholder="Search for a service"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-[#151820] px-4 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
      />
      {/* <button className="bg-white py-2 px-4 rounded-lg text-black hover:cursor-pointer">
        Search
      </button> */}
    </div>
  );
};

export default SearchService;
