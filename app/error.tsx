"use client";
export default function GlobalError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="empty" style={{padding:"15vh 20px"}}><h1>Something went wrong</h1><p>Your locally queued clinical data has not been deleted.</p><button className="btn primary" onClick={reset}>Try again</button></main>}
