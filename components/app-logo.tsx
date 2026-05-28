export default function AppLogo({ className = 'h-12', showText = true }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showText && (
        <div className='flex font-sans tracking-tight text-2xl font-bold'>
          <span className='text-white'>Work</span>
          <span className='text-indigo-600'>Wise</span>
        </div>
      )}
    </div>
  );
}
