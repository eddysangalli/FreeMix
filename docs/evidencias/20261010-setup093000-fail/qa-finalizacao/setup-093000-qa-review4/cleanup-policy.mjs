// Pure budget allocation only: no OS, process, source or network access.
export function boundedBudget(now,deadline,cap,reserve=0){if(![now,deadline,cap,reserve].every(Number.isFinite)||cap<0||reserve<0)throw Error('Invalid finite cleanup budget');return Math.max(0,Math.min(cap,deadline-now-reserve));}
