export const RECEIPT_FEED_MS=850;
// Comfortable, bounded time to read the whole corrected check before returning.
export function receiptReadMilliseconds(text){
 const words=String(text||'').trim().split(/\s+/).filter(Boolean).length;
 return Math.min(5000,Math.max(2400,1600+words*190))-2000;
}
