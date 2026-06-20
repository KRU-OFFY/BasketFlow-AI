import { AppShell } from '@/components/layout/app-shell'; import { Card } from '@/components/ui/card';
export default function AiLogDetail({params}:{params:{id:string}}){return <AppShell><h1 className="text-3xl font-bold">AI Log Detail</h1><Card className="mt-6"><pre>{JSON.stringify({id:params.id, task_type:'mock', status:'success'},null,2)}</pre></Card></AppShell>}
