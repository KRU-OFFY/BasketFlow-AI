import type { ProjectStatus } from '../types/domain.ts';

export const PROJECT_STATUS_LABELS:Record<ProjectStatus,string>={
  draft:'ฉบับร่าง',product_imported:'นำเข้าสินค้าแล้ว',brief_generated:'สร้าง Brief แล้ว',
  script_generated:'สร้างสคริปต์แล้ว',compliance_checked:'ตรวจเบื้องต้นแล้ว',warning:'ต้องแก้ไขคำเตือน',
  blocked:'ถูกบล็อก',media_generated:'สร้าง Media แล้ว',pending_approval:'รออนุมัติ',approved:'อนุมัติแล้ว',
  ready_to_publish:'พร้อมเผยแพร่',published:'เผยแพร่แล้ว',rejected:'ถูกปฏิเสธ',
};

export function projectStatusLabel(status:string):string {
  return PROJECT_STATUS_LABELS[status as ProjectStatus]??status;
}

const QUEUE_STATUS_LABELS:Record<string,string>={ready:'พร้อมเผยแพร่',scheduled:'ตั้งเวลาแล้ว',published:'เผยแพร่แล้ว',failed:'ไม่สำเร็จ',cancelled:'ยกเลิกแล้ว'};
export function queueStatusLabel(status:string):string{return QUEUE_STATUS_LABELS[status]??status;}

const AI_TASK_LABELS:Record<string,string>={generate_brief:'สร้าง AI Brief',generate_script:'สร้างสคริปต์',compliance_check_preliminary:'ตรวจ Compliance เบื้องต้น',compliance_check_final:'ตรวจความปลอดภัยขั้นสุดท้าย'};
export function aiTaskLabel(task:string):string{return AI_TASK_LABELS[task]??task;}

const AI_LOG_STATUS_LABELS:Record<string,string>={success:'สำเร็จ',error:'เกิดข้อผิดพลาด',pending:'กำลังดำเนินการ'};
export function aiLogStatusLabel(status:string):string{return AI_LOG_STATUS_LABELS[status]??status;}

const APPROVAL_STATUS_LABELS:Record<string,string>={pending:'รอดำเนินการ',approved:'อนุมัติแล้ว',rejected:'ปฏิเสธแล้ว'};
export function approvalStatusLabel(status:string):string{return APPROVAL_STATUS_LABELS[status]??status;}
