import { approveProject, rejectProjectFromForm } from '@/actions/approvals';
import { moveToPublishingQueue } from '@/actions/projects';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getOwnedProjectPage } from '@/lib/supabase/page';
import { canMoveToReadyToPublish } from '@/lib/validators/publishing';

export default async function Approval({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const {supabase,user,project}=await getOwnedProjectPage(id);
  const [{data:check,error:checkError},{data:approval,error:approvalError}]=await Promise.all([supabase.from('compliance_checks').select('*').eq('project_id',id).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),supabase.from('approvals').select('*').eq('project_id',id).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle()]);
  if(checkError || approvalError) throw new Error(`โหลด Approval Gate ไม่สำเร็จ: ${checkError?.message || approvalError?.message}`);
  const safe=canMoveToReadyToPublish({complianceStatus:check?.status,approvalStatus:approval?.status,hasAffiliateDisclosure:project.has_affiliate_disclosure,hasAiContentLabel:project.has_ai_content_label});
  const approve=approveProject.bind(null,id); const reject=rejectProjectFromForm.bind(null,id); const queue=moveToPublishingQueue.bind(null,id);
  const rows=[['Compliance PASS',check?.status==='PASS'],['Human approved',approval?.status==='approved'],['Affiliate disclosure',project.has_affiliate_disclosure],['AI Content Label',project.has_ai_content_label]] as const;
  return <AppShell><h1 className="text-3xl font-bold">Human Approval Gate</h1><Card className="mt-6 max-w-3xl"><Badge tone={safe?'green':'orange'}>{safe?'พร้อมเข้าคิว':'Safety Gate Locked'}</Badge><ul className="mt-5 space-y-3">{rows.map(([label,ok])=><li className={ok?'text-emerald-700':'text-red-700'} key={label}>{ok?'✓':'✕'} {label}</li>)}</ul><div className="mt-6 flex flex-wrap gap-3"><form action={approve}><button className="btn">Approve</button></form><form action={reject} className="flex gap-2"><input className="input" name="reason" placeholder="เหตุผลที่ปฏิเสธ"/><button className="btn btn-secondary">Reject</button></form>{safe?<form action={queue}><button className="btn">ส่งเข้า Publishing Queue</button></form>:null}</div>{approval?<p className="mt-4 text-sm text-slate-500">ผลอนุมัติล่าสุด: {approval.status}{approval.notes?` · ${approval.notes}`:''}</p>:null}</Card></AppShell>;
}
