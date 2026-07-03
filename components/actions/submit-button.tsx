'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({label,pendingLabel,className='btn'}:{label:string;pendingLabel:string;className?:string}){
  const {pending}=useFormStatus();
  return <button aria-disabled={pending} className={className} disabled={pending} type="submit">{pending?pendingLabel:label}</button>;
}
