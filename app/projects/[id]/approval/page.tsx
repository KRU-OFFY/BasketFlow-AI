import { approveProjectFromForm, rejectProjectFromForm } from '@/actions/approvals';
import { moveToPublishingQueueFromForm } from '@/actions/projects';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getOwnedProjectPage } from '@/lib/supabase/page';
import { canMoveToReadyToPublish } from '@/lib/validators/publishing';
import Link from 'next/link';

export default async function Approval({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const {supabase,user,project}=await getOwnedProjectPage(id);
  const [{data:script,error:scriptError},{data:check,error:checkError},{data:approval,error:approvalError}]=await Promise.all([
    supabase.from('scripts').select('id').eq('project_id',id).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('compliance_checks').select('*').eq('project_id',id).eq('user_id',user.id).eq('phase','final').is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('approvals').select('*').eq('project_id',id).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
  ]);
  if(scriptError || checkError || approvalError) throw new Error('โหลด Approval Gate ไม่สำเร็จ');
  const compliancePassed=check?.status==='PASS' && check.script_id===script?.id && check.media_revision===project.media_revision && project.compliance_status==='PASS';
  const humanApproved=approval?.status==='approved' && approval.script_id===script?.id && approval.compliance_check_id===check?.id && approval.media_revision===project.media_revision && project.approval_status==='approved';
  const safe=canMoveToReadyToPublish({complianceStatus:compliancePassed?'PASS':project.compliance_status,approvalStatus:humanApproved?'approved':project.approval_status,hasAffiliateDisclosure:project.has_affiliate_disclosure,hasAiContentLabel:project.has_ai_content_label});
  const approve=approveProjectFromForm.bind(null,id); const reject=rejectProjectFromForm.bind(null,id); const queue=moveToPublishingQueueFromForm.bind(null,id);
  const rows=[['Compliance PASS (สถานะปัจจุบัน)',compliancePassed],['Human approved (สถานะปัจจุบัน)',humanApproved],['Affiliate disclosure',project.has_affiliate_disclosure],['AI Content Label',project.has_ai_content_label]] as const;
  return <AppShell><h1 className="text-3xl font-bold">Human Approval Gate</h1><Card className="mt-6 max-w-3xl"><Badge tone={safe?'green':'orange'}>{safe?'พร้อมเข้าคิว':'Safety Gate Locked'}</Badge><ul className="mt-5 space-y-3">{rows.map(([label,ok])=><li className={ok?'text-emerald-700':'text-red-700'} key={label}>{ok?'✓':'✕'} {label}</li>)}</ul>{!compliancePassed?<p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Media หรือสคริปต์มีการเปลี่ยนแปลงหลังผลตรวจล่าสุด กรุณา <Link className="font-semibold underline" href={`/projects/${id}/compliance`}>รัน Compliance ใหม่</Link> ก่อนอนุมัติ</p>:null}<div className="mt-6 flex flex-wrap gap-3"><form action={approve}><input name="request_id" type="hidden" value={crypto.randomUUID()}/><button className="btn disabled:cursor-not-allowed disabled:opacity-50" disabled={!compliancePassed}>Approve</button></form><form action={reject} className="flex gap-2"><input name="request_id" type="hidden" value={crypto.randomUUID()}/><input className="input" name="reason" placeholder="เหตุผลที่ปฏิเสธ"/><button className="btn btn-secondary">Reject</button></form>{safe?<form action={queue}><input name="request_id" type="hidden" value={crypto.randomUUID()}/><button className="btn">ส่งเข้า Publishing Queue</button></form>:null}</div>{approval?<p className="mt-4 text-sm text-slate-500">ผลอนุมัติล่าสุด: {approval.status}{approval.notes?` · ${approval.notes}`:''}</p>:null}</Card></AppShell>;
}
