import { approveProjectStateAction, rejectProjectStateAction } from '@/actions/approvals';
import { moveToPublishingQueueStateAction } from '@/actions/projects';
import { WorkflowActionForm } from '@/components/actions/workflow-action-form';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectWorkflowNav } from '@/components/projects/project-workflow-nav';
import { Badge, Card } from '@/components/ui/card';
import { getOwnedProjectPage } from '@/lib/supabase/page';
import { canMoveToReadyToPublish } from '@/lib/validators/publishing';
import { approvalStatusLabel } from '@/lib/workflow/status';
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
  const approve=approveProjectStateAction.bind(null,id); const reject=rejectProjectStateAction.bind(null,id); const queue=moveToPublishingQueueStateAction.bind(null,id);
  const rows=[['Final Compliance เป็น PASS และตรงกับเวอร์ชันปัจจุบัน',compliancePassed],['อนุมัติเวอร์ชันปัจจุบันแล้ว',humanApproved],['มีข้อความแจ้ง Affiliate',project.has_affiliate_disclosure],['เปิด AI Content Label',project.has_ai_content_label]] as const;
  return <AppShell><ProjectWorkflowNav current="approval" projectId={id}/><h1 className="text-3xl font-bold">การอนุมัติโดยผู้ใช้</h1><Card className="mt-6 max-w-3xl"><Badge tone={safe?'green':'orange'}>{safe?'พร้อมเข้าคิว':'Safety Gate ยังล็อกอยู่'}</Badge><ul className="mt-5 space-y-3">{rows.map(([label,ok])=><li className={ok?'text-emerald-700':'text-red-700'} key={label}>{ok?'ผ่าน':'ยังไม่ผ่าน'} — {label}</li>)}</ul>{!compliancePassed?<p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Media หรือสคริปต์มีการเปลี่ยนแปลงหลังผลตรวจล่าสุด กรุณา <Link className="font-semibold underline" href={`/projects/${id}/compliance?phase=final`}>ตรวจความปลอดภัยขั้นสุดท้ายใหม่</Link> ก่อนอนุมัติ</p>:null}<div className="mt-6 grid gap-4 md:grid-cols-2"><WorkflowActionForm action={approve} confirmMessage="ยืนยันอนุมัติสคริปต์ ผลตรวจขั้นสุดท้าย และ Media revision ปัจจุบันหรือไม่?" disabled={!compliancePassed} initialRequestId={crypto.randomUUID()} label="อนุมัติเวอร์ชันนี้" pendingLabel="กำลังอนุมัติ…"/><WorkflowActionForm action={reject} buttonClassName="btn btn-secondary mt-3" className="rounded-2xl border border-slate-200 p-3" initialRequestId={crypto.randomUUID()} label="ปฏิเสธ" pendingLabel="กำลังบันทึก…"><label className="label" htmlFor="reason">เหตุผลที่ปฏิเสธ</label><input className="input mt-1" id="reason" name="reason" placeholder="ระบุเหตุผลเพื่อแก้ไขรอบถัดไป"/></WorkflowActionForm></div>{safe?<div className="mt-5"><WorkflowActionForm action={queue} confirmMessage="ส่ง snapshot เวอร์ชันที่อนุมัติแล้วเข้าคิวเผยแพร่หรือไม่?" initialRequestId={crypto.randomUUID()} label="ส่งเข้าคิวเผยแพร่" pendingLabel="กำลังตรวจ Safety Gate…"/></div>:null}{approval?<p className="mt-4 text-sm text-slate-500">ผลอนุมัติล่าสุด: {approvalStatusLabel(approval.status)}{approval.notes?` · ${approval.notes}`:''}</p>:null}</Card></AppShell>;
}
