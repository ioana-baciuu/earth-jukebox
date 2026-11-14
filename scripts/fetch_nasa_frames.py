"""Reproduce the museum's official NASA animation assets. Requires ffmpeg, Pillow.
Downloads stay outside the repository; assets upload through lovable-assets.
Run: python3 scripts/fetch_nasa_frames.py
Forest film is a rotating GEDI visualization, NOT a flat map or time series.
Pixel values are illustrative proxies, never calibrated physical measurements.
"""
import base64, concurrent.futures, json, subprocess, tempfile, urllib.request
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
 'ocean': ('3912', 'a000000/a003900/a003912/flat_global_ecco2_2028x1024_comp_p30.mp4', 'ECCO2 temperature and currents · 2005–2007', True),
 'storm': ('5011', 'a000000/a005000/a005011/iss_lightning_sos_yearly_07312023_2048p60.mp4', 'ISS LIS lightning · 2017–2023', True),
 'forest': ('4950', 'a000000/a004900/a004950/GEDI_global_w_colorbar_1080p60.mp4', 'GEDI forest height · rotating camera, not time change', False),
 'lights': ('5276', 'a000000/a005200/a005276/nightlights_flat_series_stills_only_lights_2160p3_h265.mp4', 'Black Marble annual composites · 2012–2023', True),
}
COUNT, WIDTH, HEIGHT = 48, 768, 384
OUT = ROOT / 'src/assets/nasa-sequences'
OUT.mkdir(parents=True, exist_ok=True)
def process(item):
 layer, (svs, path, label, geo) = item
 work = Path(tempfile.mkdtemp(prefix=f'nasa-{layer}-'))
 url = 'https://svs.gsfc.nasa.gov/vis/' + path
 movie = work / 'source.mp4'
 print(f'{layer}: downloading official NASA movie', flush=True)
 urllib.request.urlretrieve(url, movie)
 meta = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(movie)]))
 duration = float(meta['format']['duration'])
 subprocess.run(['ffmpeg','-v','error','-i',str(movie),'-vf',f'fps={COUNT/duration},scale={WIDTH}:{HEIGHT}', '-frames:v',str(COUNT),'-q:v','3',str(work/'frame-%03d.jpg')],check=True)
 frames = sorted(work.glob('frame-*.jpg'))
 if len(frames) != COUNT: raise RuntimeError(f'{layer}: expected 48 frames, got {len(frames)}')
 atlas = Image.new('RGB',(WIDTH*8,HEIGHT*6))
 grids=[]
 for i, frame in enumerate(frames):
  img=Image.open(frame).convert('RGB'); atlas.paste(img, ((i%8)*WIDTH,(i//8)*HEIGHT))
  small=img.resize((144,72))
  values=[]
  import colorsys
  for r,g,b in small.getdata():
   hue,sat,val=colorsys.rgb_to_hsv(r/255,g/255,b/255)
   if layer=='ocean': v=max(0,min(1,1-hue/0.7)) if sat>0.25 and val>0.12 else 0
   elif layer=='storm': v=max(0,(r+g)/510-b/255) if r>70 and g>60 else 0
   elif layer=='lights': v=max(r,g,b)/255
   else: v=max(0,g/255-(r+b)/510)
   values.append(round(v*255))
  grids.append(base64.b64encode(bytes(values)).decode())
 atlaspath=work/f'{layer}-48-frames.jpg'; atlas.save(atlaspath,quality=86,optimize=True)
 with (OUT/f'{layer}-atlas.jpg.asset.json').open('w') as f:
  subprocess.run(['lovable-assets','create','--file',str(atlaspath),'--filename',atlaspath.name],stdout=f,check=True)
 result={'layer':layer,'sourceUrl':url,'creditUrl':f'https://svs.gsfc.nasa.gov/{svs}/','label':label,'georeferenced':geo,'frameCount':COUNT,'columns':8,'rows':6,'duration':duration,'gridWidth':144,'gridHeight':72,'grids':grids,'note':'Normalized image-colour proxy; not live data or calibrated degrees/metres. Forest movie shows camera movement.'}
 (OUT/f'{layer}-manifest.json').write_text(json.dumps(result,separators=(',',':')))
 print(f'{layer}: 48 frames extracted, atlas uploaded',flush=True)
 return layer
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 list(pool.map(process,SOURCES.items()))
