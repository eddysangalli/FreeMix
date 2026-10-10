import policy from './creation-policy.json' with {type:'json'};
if(policy?.schema!==1||typeof policy.coverageQualified!=='boolean'||typeof policy.nativeQueriesQualified!=='boolean')throw Error('PROJECT_QUALIFICATION_POLICY_INVALID');
export const projectQualificationPolicy=Object.freeze({coverageQualified:policy.coverageQualified,nativeQueriesQualified:policy.nativeQueriesQualified});
