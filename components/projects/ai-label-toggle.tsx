'use client';
import { useState, useTransition } from 'react';
import { updateAiContentLabel } from '@/actions/media';

export function AiLabelToggle({projectId,initial}:{projectId:string;initial:boolean}) {
  const [enabled,setEnabled]=useState(initial); const [pending,startTransition]=useTransition();
  return <label className="flex items-center gap-3 font-semibold"><input checked={enabled} disabled={pending} onChange={(event)=>{const next=event.target.checked;setEnabled(next);startTransition(async()=>{try{await updateAiContentLabel(projectId,next);}catch{setEnabled(!next);}});}} type="checkbox"/> AI Content Label {pending?'(กำลังบันทึก…)':''}</label>;
}
