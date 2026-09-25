import { TriangleAlert } from "lucide-react";

export function LookupNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border-2 border-red-200 bg-white px-5 py-4">
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div>
        <p className="font-bold text-stone-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-stone-600">{message}</p>
      </div>
    </div>
  );
}
