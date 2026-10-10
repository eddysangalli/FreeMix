import cv2, json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'gtzip-qr/decoder-deps'))
import zxingcpp
from PIL import Image
image=cv2.imread(sys.argv[1])
value, points, _=cv2.QRCodeDetector().detectAndDecode(image)
expected=Path(sys.argv[2]).read_text(encoding='utf-8')
result=zxingcpp.read_barcode(Image.open(sys.argv[1]))
matches=bool(result and result.valid and result.text==expected)
print(json.dumps({'decoded':bool(result),'matches':matches,'bytes':len(result.text.encode('utf-8')) if result else 0,'decoder':'ZXing-C++2.3.0','opencv':{'version':cv2.__version__,'detected':bool(points is not None),'matches':value==expected}}))
sys.exit(0 if matches else 1)
