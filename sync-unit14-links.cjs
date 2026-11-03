// Legacy command: keep all three entries on the merged unit.
const sync=require('./sync-rescue-links.cjs');
module.exports=sync;
if(require.main===module)sync();
