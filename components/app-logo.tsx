export default function AppLogo({ className = 'h-12' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex font-sans tracking-tight text-2xl font-bold">
        <span className="text-white">Work</span>
        <span className="text-gray-400">Wise</span>
      </div>
    </div>
  );
}
