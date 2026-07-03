'use client';

import { useActionState, useEffect, useState, type ReactNode } from 'react';
import { INITIAL_ACTION_STATE, type ActionState } from '@/lib/actions/state';

type WorkflowAction=(state:ActionState,formData:FormData)=>Promise<ActionState>;

export function WorkflowActionForm({
  action,label,pendingLabel='กำลังดำเนินการ…',initialRequestId,disabled=false,
  confirmMessage,hiddenFields={},children,className='',buttonClassName='btn',
}:{
  action:WorkflowAction;
  label:string;
  pendingLabel?:string;
  initialRequestId:string;
  disabled?:boolean;
  confirmMessage?:string;
  hiddenFields?:Record<string,string>;
  children?:ReactNode;
  className?:string;
  buttonClassName?:string;
}){
  const [state,formAction,pending]=useActionState(action,INITIAL_ACTION_STATE);
  const [requestId,setRequestId]=useState(initialRequestId);
  useEffect(()=>{if(state.requestId)setRequestId(crypto.randomUUID());},[state.requestId]);
  return <form action={formAction} className={className} onSubmit={(event)=>{
    if(confirmMessage && !window.confirm(confirmMessage))event.preventDefault();
  }}>
    <input name="request_id" type="hidden" value={requestId}/>
    {Object.entries(hiddenFields).map(([name,value])=><input key={name} name={name} type="hidden" value={value}/>)}
    {children}
    <button className={buttonClassName} disabled={disabled||pending} type="submit">{pending?pendingLabel:label}</button>
    {state.message?<p aria-live="polite" className={`mt-3 text-sm font-semibold ${state.ok?'text-emerald-700':'text-red-700'}`} role={state.ok?'status':'alert'}>{state.message}</p>:null}
  </form>;
}
