import Link from "next/link";
import { Card } from "./card";

export function EmptyState({ title, href, action }: { title: string; href?: string; action?: string }) {
  return (
    <Card className="text-center">
      <p className="text-slate-600">{title}</p>
      {href && action ? <Link className="mt-4 inline-block rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white" href={href}>{action}</Link> : null}
    </Card>
  );
}
