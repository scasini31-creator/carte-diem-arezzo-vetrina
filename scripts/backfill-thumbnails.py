import io, json, re, hashlib, pathlib, urllib.request, urllib.parse
from PIL import Image, ImageOps
root = pathlib.Path(__file__).resolve().parent.parent
config = (root / 'supabase-config.js').read_text()
base = re.search(r"SUPABASE_URL='([^']+)'", config).group(1)
key = re.search(r"SUPABASE_PUBLISHABLE_KEY='([^']+)'", config).group(1)
index = root / 'thumbs/index.js'
mapping = json.loads(index.read_text().split('=',1)[1].strip().rstrip(';'))
def get(url, headers=None, limit=20*1024*1024):
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=40) as response:
        data = response.read(limit+1)
    if len(data)>limit: raise ValueError('File too large')
    return data
rows = []
for start in range(0,10000,500):
    query = '/rest/v1/products?select=id,image_paths,details&archived_at=is.null&order=id.asc&limit=500&offset='+str(start)
    batch = json.loads(get(base+query, {'apikey':key}))
    rows.extend(batch)
    if len(batch)<500: break
jobs = {}
for row in rows:
    previews = (row.get('details') or {}).get('preview_paths') or []
    for i,path in enumerate(row.get('image_paths') or []):
        if not isinstance(path,str) or not path or (i<len(previews) and previews[i]): continue
        existing = mapping.get(path)
        if existing and (root/existing).is_file(): continue
        jobs[path] = min(i,jobs.get(path,i))
made = failed = total = 0
for path,i in sorted(jobs.items(),key=lambda p:p[1]):
    if total >= 250*1024*1024: break
    try:
        data = get(base+'/storage/v1/object/public/product-images/'+urllib.parse.quote(path,safe='/'))
        total += len(data)
        with Image.open(io.BytesIO(data)) as original:
            image = ImageOps.exif_transpose(original).convert('RGB')
            image.thumbnail((480,480),Image.Resampling.LANCZOS)
            dest = 'thumbs/auto-'+hashlib.sha256(path.encode()).hexdigest()+'.webp'
            image.save(root/dest,'WEBP',quality=72,method=4)
        mapping[path]=dest
        made+=1
    except Exception as e:
        failed+=1
        print('Skipped image:',type(e).__name__)
index.write_text('window.CD_STATIC_THUMBS='+json.dumps(mapping,ensure_ascii=True,separators=(',',':'))+';\n')
print(f'Products={len(rows)}, missing={len(jobs)}, created={made}, failed={failed}, source bytes={total}')
if jobs and not made: raise SystemExit('No thumbnails created')
