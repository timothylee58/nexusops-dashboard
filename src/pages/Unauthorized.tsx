import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-slate-950 grid-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="text-[120px] font-mono font-bold text-amber-400 leading-none">403</div>
      <h1 className="text-2xl font-semibold text-zinc-100 mt-2">Access Restricted</h1>
      <p className="text-sm text-zinc-400 mt-2 max-w-sm">
        Your current role does not permit access to this resource.
      </p>
      <Link
        to="/"
        className="mt-6 text-xs font-medium px-4 py-2 rounded-full bg-amber-400 text-slate-950 hover:bg-amber-300 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
