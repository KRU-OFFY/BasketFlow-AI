export type ActionState<T=undefined> = {
  ok:boolean;
  message:string;
  requestId?:string;
  data?:T;
};

export const INITIAL_ACTION_STATE:ActionState={ok:false,message:''};

export function actionSuccess(message:string,requestId:string):ActionState {
  return {ok:true,message,requestId};
}

export function actionFailure(error:unknown,requestId:string):ActionState {
  return {ok:false,message:error instanceof Error?error.message:'ดำเนินการไม่สำเร็จ กรุณาลองใหม่',requestId};
}
