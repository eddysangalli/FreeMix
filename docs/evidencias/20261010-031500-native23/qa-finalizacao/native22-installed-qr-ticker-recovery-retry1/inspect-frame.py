import json, sys
from PIL import Image
image=Image.open(sys.argv[1]).convert('RGBA')
alpha=image.getchannel('A').getextrema()
green=[]
white=0
for y in range(image.height):
    for x in range(image.width):
        r,g,b,a=image.getpixel((x,y))
        if a>240 and abs(r-35)<4 and abs(g-180)<4 and abs(b-120)<4:
            green.append((x,y))
        if x<416 and a>200 and min(r,g,b)>210:
            white+=1
bounds=None
if green:
    bounds={'x0':min(x for x,y in green),'y0':min(y for x,y in green),'x1':max(x for x,y in green),'y1':max(y for x,y in green)}
print(json.dumps({'width':image.width,'height':image.height,'alphaMax':alpha[1],'fullyTransparent':alpha[1]==0,'ownAvatarPixels':len(green),'ownAvatarBounds':bounds,'tickerWhiteGlyphPixels':white}))
