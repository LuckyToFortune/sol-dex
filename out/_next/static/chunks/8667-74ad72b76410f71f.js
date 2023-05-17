"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8667],{8667:function(n,e,t){t.d(e,{Kb:function(){return b},ZP:function(){return K},WX:function(){return Z},qC:function(){return A}}),t(47511);var l=t(93513),r=t(34003),o=t(76383),i=t(27993),a=t(91371),s=t(96662),c=t(94355),u=t(28013),d=t(80813),v=t(53002),p=t(17097),y=t(75640);async function f(n){let{connection:e,wallet:t,txVersion:l,transactions:r}=n,o=await (0,y.cq6)({connection:e,payer:t,innerTransactions:r,txType:l});return o}let S=[];async function g(n){var e;let{transaction:t,payload:l,batchOptions:r,cache:o=!0}=n;if(!r||!("_buildArgs"in(e=l.connection))||!("_rpcBatchRequest"in e)||!("_compile"in t)||!("_serialize"in t))return h(t,l,o);{let n;let e=new Promise(e=>{n=e});if(S.push({tx:t,txidPromise:e,resolveFn:n}),S.length===r.allSignedTransactions.length){let n=await x(S.map(n=>n.tx),l);S.forEach((e,t)=>{let{resolveFn:l}=e;l(n[t])}),S.splice(0,S.length)}return e}}async function h(n,e,t){var l,o,i,a;if(null===(l=e.signerkeyPair)||void 0===l?void 0:l.ownerKeypair)return(0,r.Z)(!Z(n),"if use force ownerKeypair, must use transaction, not versionedTransaction"),n.feePayer=null!==(i=null===(o=e.signerkeyPair.payerKeypair)||void 0===o?void 0:o.publicKey)&&void 0!==i?i:e.signerkeyPair.ownerKeypair.publicKey,e.connection.sendTransaction(n,[null!==(a=e.signerkeyPair.payerKeypair)&&void 0!==a?a:e.signerkeyPair.ownerKeypair]);{let l=A(n,{cache:t});return await e.connection.sendRawTransaction(l,{skipPreflight:!0})}}async function x(n,e){let t=n.map(n=>n.serialize().toString("base64")),l=t.map(n=>{let t=e.connection._buildArgs([n],void 0,"base64");return{methodName:"sendTransaction",args:t}}),r=(await e.connection._rpcBatchRequest(l)).map(n=>n.result.value);return r}var T=t(95793),w=t(72573),m=t(16938),P=t(3363);function E(n){return(0,p.Kn)(n)&&"instructions"in n&&"instructionTypes"in n}function b(n,e){return t=>K(n(t),(0,o.Gm)(e,{additionalMultiOptionCallback:t,additionalSingleOptionCallback:t}))}async function K(n,e){var t,u,y,f,S,g,h,x,T;let{transactionCollector:w,collected:{innerTransactions:m,singleTxOptions:P,multiTxOption:E}}=function(n){let e=[],t={},l=[],{additionalSingleOptionCallback:r,additionalMultiOptionCallback:i}=null!=n?n:{},a=(n,t)=>{l.push(n),e.push((0,o.Gm)(null!=t?t:{},r))},s=(n,e)=>{n.forEach(n=>{let[e,t]=Array.isArray(n)?n:[n];a(e,t)}),Object.assign(t,(0,o.Gm)(null!=e?e:{},i))},c=(n,e)=>{let t=(0,p.kJ)(n);if(t){let t=n.map(n=>(0,p.kJ)(n)?[n[0],{...e,...n[1]}]:[n,e]);s(t,e)}else a(n,e)};return{transactionCollector:{add:c},collected:{innerTransactions:l,singleTxOptions:e,multiTxOption:t}}}(e);a.ZP.setState({isApprovePanelShown:!0});try{let{signAllTransactions:i,owner:c,txVersion:p}=v.Z.getState(),y=s.ZP.getState().connection;if((0,r.Z)(y,"no rpc connection"),null==e?void 0:null===(t=e.forceKeyPairs)||void 0===t?void 0:t.ownerKeypair){let t=e.forceKeyPairs.ownerKeypair.publicKey,l=await (0,d.p)({owner:t,connection:y});await n({transactionCollector:w,baseUtils:{connection:y,owner:t,...l}})}else{let{tokenAccounts:e,allTokenAccounts:t}=v.Z.getState();(0,r.Z)(c,"wallet not connected"),await n({transactionCollector:w,baseUtils:{connection:y,owner:c,tokenAccounts:e,allTokenAccounts:t}})}let f=null!=c?c:null==e?void 0:null===(u=e.forceKeyPairs)||void 0===u?void 0:u.ownerKeypair.publicKey;(0,r.Z)(f,"no owner provided");let S=await I({transactions:m,singleOptions:(0,l.Uy)(P,n=>{n[0]&&(n[0].onTxSentFinally=(0,o.tS)(()=>{a.ZP.setState({isApprovePanelShown:!1})},n[0].onTxSentFinally))}),multiOption:E,payload:{owner:f,connection:y,txVersion:p,signAllTransactions:i,signerkeyPair:null==e?void 0:e.forceKeyPairs}});return a.ZP.setState({isApprovePanelShown:!1}),S}catch(r){let{logError:n}=c.Z.getState();console.warn(r);let e=null!==(T=null==P?void 0:null===(y=P[0])||void 0===y?void 0:null===(f=y.txHistoryInfo)||void 0===f?void 0:f.forceErrorTitle)&&void 0!==T?T:(null!==(x=null==P?void 0:null===(S=P[0])||void 0===S?void 0:null===(g=S.txHistoryInfo)||void 0===g?void 0:g.title)&&void 0!==x?x:"")+" Error",t=r instanceof Error?r.message.replace(/\.$/,""):String(r),l=(0,i.u)(null==P?void 0:null===(h=P[0])||void 0===h?void 0:h.txErrorNotificationDescription,[r]);return n(e,l||t),a.ZP.setState({isApprovePanelShown:!1}),{allSuccess:!1,txids:[]}}}let k=new Map;function Z(n){return(0,p.Kn)(n)&&"version"in n}function A(n,e){let t=Z(n)?n.message.recentBlockhash:n.recentBlockhash;if(t&&k.has(t))return k.get(t);{let l=n.serialize();return t&&(null==e?void 0:e.cache)&&k.set(t,l),l}}async function I(n){let{transactions:e,singleOptions:t,multiOption:r,payload:i}=n;return new Promise((n,a)=>(async()=>{let s=[],d=[],v=t=>{if(d.push(t),d.length===e.length){var l;null===(l=r.onTxAllSuccess)||void 0===l||l.call(r,{txids:s}),n({allSuccess:!0,txids:s})}},y=(0,l.Uy)(t,e=>{e.forEach(e=>{e.onTxSentSuccess=(0,o.tS)(n=>{let{txid:e}=n;s.push(e)},e.onTxSentSuccess),e.onTxError=(0,o.tS)(()=>{var e;null===(e=r.onTxAnyError)||void 0===e||e.call(r,{txids:s}),n({allSuccess:!1,txids:s})},e.onTxError),e.onTxSuccess=(0,o.tS)(n=>{let{txid:e}=n;v(e)},e.onTxSuccess)})});try{var S;let n=e.every(E)?await f({connection:i.connection,wallet:i.owner,txVersion:i.txVersion,transactions:e}):e;try{console.info("tx transactions: ",function n(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:10;return!t||(0,T.J_)(e)||(0,p.pt)(e)?e:(0,p.CU)(e)?(0,P.ZP)(e):(0,p.ve)(e)?(0,w.B)(e):(0,p.kJ)(e)?e.map(e=>n(e,t-1)):(0,p.Kn)(e)?(0,m.xh)(e,e=>n(e,t-1)):e}(n),n.map(n=>n.serialize({requireAllSignatures:!1,verifySignatures:!1}).toString("base64")))}catch(n){console.warn("tx log error")}let t=null===(S=i.signerkeyPair)||void 0===S?void 0:S.ownerKeypair,a=await (t?n:i.signAllTransactions(n)),{mutatedSingleOptions:s}=function(n){let{transactions:e,singleOptions:t,multiOption:r}=n,i=t.map((n,t)=>{let{txHistoryInfo:l,...r}=n;return{transaction:e[t],historyInfo:l,...r}}),a=c.Z.getState().logTxid({txInfos:i}),s=(0,l.Uy)(t,n=>{n.forEach(n=>{n.onTxSentSuccess=(0,o.tS)(n=>{var e;let{txid:t,transaction:l}=n;null===(e=a.changeItemInfo)||void 0===e||e.call(a,{txid:t,state:"processing"},{transaction:l})},n.onTxSentSuccess),n.onTxError=(0,o.tS)(n=>{var t;let{txid:l,transaction:r,error:o}=n;null===(t=a.changeItemInfo)||void 0===t||t.call(a,{txid:l,state:"error",error:o},{transaction:r});let i=e.indexOf(r);i<0||e.slice(i+1).forEach(n=>{var e;null===(e=a.changeItemInfo)||void 0===e||e.call(a,{state:"aborted"},{transaction:n})})},n.onTxError),n.onTxSuccess=(0,o.tS)(n=>{var e;let{txid:t,transaction:l}=n;null===(e=a.changeItemInfo)||void 0===e||e.call(a,{txid:t,state:"success"},{transaction:l})},n.onTxSuccess)})}),d=(0,l.Uy)(s,n=>{n.forEach(n=>{var e;let{...t}=null!==(e=n.txHistoryInfo)&&void 0!==e?e:{};n.onTxFinally=(0,o.tS)(n=>{let{txid:e,type:l,passedMultiTxid:r,isMulti:o}=n;u.Z.getState().addHistoryItem({status:"error"===l?"fail":l,txid:e,time:Date.now(),isMulti:o,relativeTxids:r,...t})},n.onTxFinally)})});return{mutatedSingleOptions:d}}({transactions:a,singleOptions:y,multiOption:r}),d=function(n){let{transactions:e,sendMode:t,singleOptions:r,payload:i}=n,a={isMulti:e.length>1,passedMultiTxid:Array.from({length:e.length}),multiTransactionLength:e.length,transactions:e};if("parallel(dangerous-without-order)"===t||"parallel(batch-transactions)"===t){let n=()=>{e.forEach((n,e)=>O({transaction:n,wholeTxidInfo:a,payload:i,isBatched:"parallel(batch-transactions)"===t,singleOption:r[e]}))};return n}{let n=e.reduceRight((n,e,s)=>{var c;let{fn:u,method:d}=n,v=r[s];return{fn:()=>O({transaction:e,wholeTxidInfo:a,payload:i,singleOption:(0,l.Uy)(v,n=>{"finally"===d?n.onTxFinally=(0,o.tS)(u,n.onTxFinally):"error"===d?n.onTxError=(0,o.tS)(u,n.onTxError):"success"===d&&(n.onTxSuccess=(0,o.tS)(u,n.onTxSuccess))})}),method:null!==(c=v.continueWhenPreviousTx)&&void 0!==c?c:"queue(all-settle)"===t?"finally":"success"}},{fn:()=>{},method:"success"});return n.fn}}({transactions:a,sendMode:r.sendMode,singleOptions:s,payload:i});d()}catch(n){a(n)}})())}async function O(n){var e,t,l;let{transaction:o,wholeTxidInfo:i,singleOption:a,payload:u,isBatched:d}=n,v=i.transactions.indexOf(o),p={...i,currentIndex:v};try{let n=await g({transaction:o,payload:u,batchOptions:d?{allSignedTransactions:i.transactions}:void 0,cache:!!(null==a?void 0:a.cacheTransaction)});(0,r.Z)(n,"something went wrong in sending transaction"),null==a||null===(e=a.onTxSentSuccess)||void 0===e||e.call(a,{transaction:o,txid:n,...p}),i.passedMultiTxid[v]=n//! 💩 bad method! it's mutate method!
,function(n){let{txid:e,transaction:t,extraTxidInfo:l,callbacks:r}=n,{connection:o}=s.ZP.getState(),{logError:i}=c.Z.getState();if(!o){i("no rpc connection");return}o.onSignature(e,(n,o)=>{var i,a,s,c;n.err?(null==r||null===(i=r.onTxError)||void 0===i||i.call(r,{txid:e,transaction:t,signatureResult:n,context:o,error:n.err,...l}),null==r||null===(a=r.onTxFinally)||void 0===a||a.call(r,{txid:e,transaction:t,signatureResult:n,context:o,type:"error",...l})):(null==r||null===(s=r.onTxSuccess)||void 0===s||s.call(r,{txid:e,transaction:t,signatureResult:n,context:o,...l}),null==r||null===(c=r.onTxFinally)||void 0===c||c.call(r,{txid:e,transaction:t,signatureResult:n,context:o,type:"success",...l}))},"processed"),o.getSignatureStatus(e)}({txid:n,transaction:o,extraTxidInfo:p,callbacks:{onTxSuccess(n){var e;null==a||null===(e=a.onTxSuccess)||void 0===e||e.call(a,{...n,...p})},onTxError(n){var e;console.error("tx error: ",n.error),null==a||null===(e=a.onTxError)||void 0===e||e.call(a,{...n,...p})},onTxFinally(n){var e;null==a||null===(e=a.onTxFinally)||void 0===e||e.call(a,{...n,...p})}}})}catch(n){console.error("fail to send tx: ",n),null==a||null===(t=a.onTxSentError)||void 0===t||t.call(a,{err:n,...p})}finally{null==a||null===(l=a.onTxSentFinally)||void 0===l||l.call(a)}}}}]);