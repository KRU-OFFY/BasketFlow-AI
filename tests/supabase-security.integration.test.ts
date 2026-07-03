import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url=process.env.SUPABASE_TEST_URL;
const anonKey=process.env.SUPABASE_TEST_ANON_KEY;
const serviceRoleKey=process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const configured=Boolean(url && anonKey && serviceRoleKey);

function requestId(){return crypto.randomUUID();}

async function claim(admin:SupabaseClient,userId:string,projectId:string|null,actionType:string,id=requestId()){
  const result=await admin.rpc('claim_workflow_action',{
    p_request_id:id,p_user_id:userId,p_project_id:projectId,p_action_type:actionType,
  });
  assert.equal(result.error,null,result.error?.message);
  return {id,status:result.data};
}

const compliancePayload={
  status:'PASS',risk_score:0,issues:[],prohibited_words:[],missing_requirements:[],
  suggested_fixes:[],safe_rewrite:'สคริปต์ปลอดภัย มีการเปิดเผยลิงก์ Affiliate ครบถ้วน',
  prompt_version:'integration-v1',ai_provider:'mock',ai_model:'mock-v1',
};

test('Supabase blocks browser safety writes and enforces version-bound queue snapshots', {skip:!configured}, async(t)=>{
  const admin=createClient(url!,serviceRoleKey!,{auth:{persistSession:false,autoRefreshToken:false}});
  const suffix=crypto.randomUUID();
  const password='BasketPilot-Test-Only-9!';
  const users=[] as string[];
  t.after(async()=>{for(const id of users) await admin.auth.admin.deleteUser(id);});

  const createUser=async(label:string)=>{
    const result=await admin.auth.admin.createUser({email:`${label}-${suffix}@example.test`,password,email_confirm:true});
    assert.equal(result.error,null,result.error?.message);
    assert.ok(result.data.user);
    users.push(result.data.user.id);
    const client=createClient(url!,anonKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const signIn=await client.auth.signInWithPassword({email:result.data.user.email!,password});
    assert.equal(signIn.error,null,signIn.error?.message);
    return {id:result.data.user.id,client};
  };

  const owner=await createUser('owner');
  const other=await createUser('other');
  const productInsert=await admin.from('products').insert({
    user_id:owner.id,title:'แก้วเก็บอุณหภูมิทดสอบ',affiliate_link:'https://shp.ee/test123',
    source:'manual',affiliate_validation_status:'validated',risk_flags:[],
  }).select('id').single();
  assert.equal(productInsert.error,null,productInsert.error?.message);
  const productId=productInsert.data!.id;

  const createRequest=requestId();
  const firstClaim=await claim(admin,owner.id,null,'create_project',createRequest);
  const duplicateClaim=await claim(admin,owner.id,null,'create_project',createRequest);
  assert.equal(firstClaim.status,'claimed');
  assert.equal(duplicateClaim.status,'pending');
  const projectRpc=await admin.rpc('record_review_project',{
    p_request_id:createRequest,p_user_id:owner.id,p_product_id:productId,p_title:'โปรเจกต์ Integration',
  });
  assert.equal(projectRpc.error,null,projectRpc.error?.message);
  const projectId=projectRpc.data as string;
  const duplicateWrite=await admin.rpc('record_review_project',{
    p_request_id:createRequest,p_user_id:owner.id,p_product_id:productId,p_title:'โปรเจกต์ซ้ำ',
  });
  assert.ok(duplicateWrite.error,'request_id เดิมต้องบันทึกผลลัพธ์ซ้ำไม่ได้');
  const projectCount=await admin.from('review_projects').select('*',{count:'exact',head:true}).eq('user_id',owner.id);
  assert.equal(projectCount.count,1);

  const directProjectUpdate=await owner.client.from('review_projects').update({approval_status:'approved'}).eq('id',projectId);
  assert.ok(directProjectUpdate.error,'browser JWT ต้อง update review_projects ไม่ได้');
  const directComplianceInsert=await owner.client.from('compliance_checks').insert({
    user_id:owner.id,project_id:projectId,status:'PASS',risk_score:0,
    prompt_version:'forged',ai_provider:'forged',ai_model:'forged',phase:'final',media_revision:0,
  });
  assert.ok(directComplianceInsert.error,'browser JWT ต้อง insert compliance_checks ไม่ได้');
  const isolatedRead=await other.client.from('review_projects').select('id').eq('id',projectId);
  assert.equal(isolatedRead.error,null,isolatedRead.error?.message);
  assert.deepEqual(isolatedRead.data,[],'ผู้ใช้อื่นต้องอ่านโปรเจกต์ข้ามบัญชีไม่ได้');

  const briefRequest=await claim(admin,owner.id,projectId,'generate_brief');
  const brief=await admin.rpc('record_ai_brief',{
    p_request_id:briefRequest.id,p_user_id:owner.id,p_project_id:projectId,p_payload:{
      product_summary:'สรุปสินค้า',target_audience:'ผู้ซื้อออนไลน์',pain_points:[],key_benefits:[],
      usp:'ข้อมูลตรงไปตรงมา',content_angles:[],hook_ideas:[],risk_level:'low',creator_note:'ทดสอบ',
      prompt_version:'integration-v1',ai_provider:'mock',ai_model:'mock-v1',
    },
  });
  assert.equal(brief.error,null,brief.error?.message);

  const scriptRequest=await claim(admin,owner.id,projectId,'generate_script');
  const script=await admin.rpc('record_script',{
    p_request_id:scriptRequest.id,p_user_id:owner.id,p_project_id:projectId,p_payload:{
      duration_seconds:30,hook:'รีวิวก่อนซื้อ',hook_candidates:['รีวิวก่อนซื้อ','ข้อควรรู้ก่อนซื้อ'],selected_hook:'รีวิวก่อนซื้อ',problem:'ต้องการข้อมูล',product_intro:'แก้วเก็บอุณหภูมิ',
      benefits:['ใช้งานสะดวก'],use_case:'ใช้ทุกวัน',cta:'ดูรายละเอียดก่อนตัดสินใจ',
      affiliate_disclosure:'คลิปนี้มีลิงก์ Affiliate',full_script:'รีวิวตามข้อมูลจริง คลิปนี้มีลิงก์ Affiliate',
      subtitle_lines:['รีวิวตามข้อมูลจริง'],prompt_version:'integration-v1',ai_provider:'mock',ai_model:'mock-v1',
    },
  });
  assert.equal(script.error,null,script.error?.message);
  const scriptId=script.data as string;
  const storedScript=await admin.from('scripts').select('hook_candidates,selected_hook').eq('id',scriptId).single();
  assert.equal(storedScript.error,null,storedScript.error?.message);
  assert.deepEqual(storedScript.data?.hook_candidates,['รีวิวก่อนซื้อ','ข้อควรรู้ก่อนซื้อ']);
  assert.equal(storedScript.data?.selected_hook,'รีวิวก่อนซื้อ');

  const preliminaryRequest=await claim(admin,owner.id,projectId,'run_preliminary_compliance');
  const preliminary=await admin.rpc('record_compliance_check',{
    p_request_id:preliminaryRequest.id,p_user_id:owner.id,p_project_id:projectId,p_phase:'preliminary',p_payload:compliancePayload,
  });
  assert.equal(preliminary.error,null,preliminary.error?.message);
  const prematureApprovalRequest=await claim(admin,owner.id,projectId,'approve_project');
  const prematureApproval=await admin.rpc('record_project_approval',{
    p_request_id:prematureApprovalRequest.id,p_user_id:owner.id,p_project_id:projectId,p_status:'approved',p_notes:null,
  });
  assert.ok(prematureApproval.error,'Preliminary PASS ต้องอนุมัติโปรเจกต์ไม่ได้');
  await admin.from('workflow_action_requests').update({status:'failed'}).eq('id',prematureApprovalRequest.id);

  const mediaBeforeLabelRequest=await claim(admin,owner.id,projectId,'create_media');
  const mediaBeforeLabel=await admin.rpc('record_media_asset',{
    p_request_id:mediaBeforeLabelRequest.id,p_user_id:owner.id,p_project_id:projectId,p_type:'voiceover',
  });
  assert.equal(mediaBeforeLabel.error,null,mediaBeforeLabel.error?.message);
  const projectBeforeLabel=await admin.from('review_projects').select('media_revision').eq('id',projectId).single();
  assert.equal(projectBeforeLabel.error,null,projectBeforeLabel.error?.message);

  const labelRequest=await claim(admin,owner.id,projectId,'update_ai_label');
  const label=await admin.rpc('set_project_ai_label',{
    p_request_id:labelRequest.id,p_user_id:owner.id,p_project_id:projectId,p_enabled:true,
  });
  assert.equal(label.error,null,label.error?.message);
  const projectAfterLabel=await admin.from('review_projects').select('media_revision').eq('id',projectId).single();
  assert.equal(projectAfterLabel.error,null,projectAfterLabel.error?.message);
  const mediaRevision=projectAfterLabel.data!.media_revision;
  assert.equal(mediaRevision,projectBeforeLabel.data!.media_revision,'AI label ต้องไม่ทำให้ Media ที่เพิ่งสร้างกลายเป็น revision เก่า');
  const currentMedia=await admin.from('media_assets').select('id').eq('id',mediaBeforeLabel.data).eq('media_revision',mediaRevision).single();
  assert.equal(currentMedia.error,null,currentMedia.error?.message);

  const finalRequest=await claim(admin,owner.id,projectId,'run_final_compliance');
  const finalCheck=await admin.rpc('record_compliance_check',{
    p_request_id:finalRequest.id,p_user_id:owner.id,p_project_id:projectId,p_phase:'final',p_payload:compliancePayload,
  });
  assert.equal(finalCheck.error,null,finalCheck.error?.message);
  const finalCheckId=finalCheck.data as string;
  const approvalRequest=await claim(admin,owner.id,projectId,'approve_project');
  const approval=await admin.rpc('record_project_approval',{
    p_request_id:approvalRequest.id,p_user_id:owner.id,p_project_id:projectId,p_status:'approved',p_notes:null,
  });
  assert.equal(approval.error,null,approval.error?.message);
  const approvalId=approval.data as string;
  const queueRequest=await claim(admin,owner.id,projectId,'queue_project');
  const queued=await admin.rpc('queue_project',{
    p_request_id:queueRequest.id,p_user_id:owner.id,p_project_id:projectId,
  });
  assert.equal(queued.error,null,queued.error?.message);
  const queueRow=await admin.from('posting_queue').select('*').eq('id',queued.data).single();
  assert.equal(queueRow.error,null,queueRow.error?.message);
  assert.equal(queueRow.data!.script_id,scriptId);
  assert.equal(queueRow.data!.compliance_check_id,finalCheckId);
  assert.equal(queueRow.data!.approval_id,approvalId);
  assert.equal(queueRow.data!.media_revision,mediaRevision);

  const mediaRequest=await claim(admin,owner.id,projectId,'create_media');
  const media=await admin.rpc('record_media_asset',{
    p_request_id:mediaRequest.id,p_user_id:owner.id,p_project_id:projectId,p_type:'subtitle',
  });
  assert.equal(media.error,null,media.error?.message);
  const staleQueueRequest=await claim(admin,owner.id,projectId,'queue_project');
  const staleQueue=await admin.rpc('queue_project',{
    p_request_id:staleQueueRequest.id,p_user_id:owner.id,p_project_id:projectId,
  });
  assert.ok(staleQueue.error,'Media เปลี่ยนแล้ว Approval/Final Compliance เดิมต้องเข้าคิวไม่ได้');
  await admin.from('workflow_action_requests').update({status:'failed'}).eq('id',staleQueueRequest.id);

  const currentScriptBefore=await admin.from('scripts').select('id').eq('project_id',projectId).is('superseded_at',null).single();
  const invalidScriptRequest=await claim(admin,owner.id,projectId,'generate_script');
  const invalidScript=await admin.rpc('record_script',{
    p_request_id:invalidScriptRequest.id,p_user_id:owner.id,p_project_id:projectId,p_payload:{
      duration_seconds:17,hook:'invalid',affiliate_disclosure:'มี Affiliate',full_script:'invalid',
      prompt_version:'integration-v1',ai_provider:'mock',ai_model:'mock-v1',
    },
  });
  assert.ok(invalidScript.error,'constraint failure ต้องทำให้ RPC ล้มเหลว');
  const currentScriptAfter=await admin.from('scripts').select('id').eq('project_id',projectId).is('superseded_at',null).single();
  assert.equal(currentScriptAfter.data?.id,currentScriptBefore.data?.id,'RPC failure ต้อง rollback การ supersede script เดิม');
});
