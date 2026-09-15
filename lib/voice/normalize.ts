const BANGLA_DIGITS='০১২৩৪৫৬৭৮৯';
const DIGIT_MAP=new Map([...BANGLA_DIGITS].map((d,i)=>[d,String(i)]));
const WORD_NUMBERS:Record<string,number>={শূন্য:0,এক:1,দুই:2,তিন:3,চার:4,পাঁচ:5,ছয়:6,ছয়:6,সাত:7,আট:8,নয়:9,নয়:9,দশ:10,এগারো:11,বারো:12,তেরো:13,চৌদ্দ:14,পনেরো:15,ষোল:16,সতেরো:17,আঠারো:18,উনিশ:19,বিশ:20,ত্রিশ:30,চল্লিশ:40,পঞ্চাশ:50,ষাট:60,সত্তর:70,আশি:80,নব্বই:90,একশ:100,একশো:100,দুইশ:200,দুইশো:200,পাঁচশ:500,পাঁচশো:500,হাজার:1000};
export function normalizeBengaliDigits(input:string){return [...input].map(c=>DIGIT_MAP.get(c)??c).join('');}
export function normalizeVoiceText(input:string){return normalizeBengaliDigits(input).normalize('NFKC').trim().replace(/\s+/g,' ');}
export function extractNumber(input:string):number|null{const s=normalizeBengaliDigits(input).replace(/,/g,'');const m=s.match(/(?:^|\s)(\d+(?:\.\d+)?)(?:\s|$)/);if(m)return Number(m[1]);for(const [word,value] of Object.entries(WORD_NUMBERS))if(new RegExp(`(^|\\s)${word}(?=\\s|$)`).test(input))return value;return null;}
