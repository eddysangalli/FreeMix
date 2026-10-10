import json,sys
from PIL import Image
image=Image.open(sys.argv[1]).convert('RGBA')
alpha=image.getchannel('A').getextrema()
print(json.dumps({'width':image.width,'height':image.height,'alphaMin':alpha[0],'alphaMax':alpha[1],'fullyTransparent':alpha[1]==0}))
