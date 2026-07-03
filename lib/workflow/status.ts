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
