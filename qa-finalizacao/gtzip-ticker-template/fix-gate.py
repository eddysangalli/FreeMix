from pathlib import Path
p=Path(__file__).resolve().parent/'draft/gtzip-xml.mjs';s=p.read_bytes();old=b"every(n=>['Layer','Layer.Composition'";assert old in s;p.write_bytes(s.replace(old,b"every(n=>['Ticker.Template','Layer','Layer.Composition'"))
