const SUPABASE_URL='https://hheemlsfyxnhtigwewwv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_8o5T-1OOW3FIfufhKBoYIw_IA0KcLu_';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const imageUrl=path=>sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
const rowToProduct=r=>{const p=[r.name,r.sigla||'',r.category,r.price===null?null:Number(r.price),'',r.condition_or_grade||'','✦',(r.image_paths||[]).map(imageUrl),r.quantity,r.description||'',r.language||'ITA'];p.id=r.id;p.paths=r.image_paths||[];return p;};
const productToRow=p=>({name:p[0],sigla:['singole','gradate'].includes(p[2])?(p[1]||null):null,category:p[2],price:p[3],condition_or_grade:['singole','gradate'].includes(p[2])?(p[5]||null):null,language:p[10]||'ITA',quantity:p[8],description:p[9]||'',image_paths:p.paths||[]});
async function loadProducts(){const {data,error}=await sb.from('products').select('id,name,sigla,category,price,condition_or_grade,language,quantity,description,image_paths,created_at,updated_at,catalog_group').order('created_at',{ascending:false});if(error)throw error;return data.map(rowToProduct)}
