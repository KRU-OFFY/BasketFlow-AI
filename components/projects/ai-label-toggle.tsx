'use client';
import { useState, useTransition } from 'react';
import { updateAiContentLabel } from '@/actions/media';

export function AiLabelToggle({projectId,initial}:{projectId:string;initial:boolean}) {
  const [enabled,setEnabled]=useState(initial); const [message,setMessage]=useState(''); const [pending,startTransition]=useTransition();
  return <div><label className="flex items-center gap-3 font-semibold"><input aria-describedby="ai-label-feedback" checked={enabled} disabled={pending} onChange={(event)=>{const next=event.target.checked;setEnabled(next);setMessage('');startTransition(async()=>{try{await updateAiContentLabel(projectId,next);setMessage('บันทึก AI Content Label แล้ว');}catch{setEnabled(!next);setMessage('บันทึกไม่สำเร็จ ระบบคืนค่าเดิมแล้ว กรุณาลองใหม่');}});}} type="checkbox"/> AI Content Label {pending?'(กำลังบันทึก…)':''}</label><p aria-live="polite" className={`mt-2 text-sm ${message.includes('ไม่สำเร็จ')?'text-red-700':'text-emerald-700'}`} id="ai-label-feedback">{message}</p></div>;
}
