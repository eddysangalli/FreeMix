# Print the dock layout stored in a QMainWindow saveState() blob (the DockState key of OBS's user.ini).
import base64, re, struct, sys

def load(path):
    ini = open(path, encoding="utf-8").read()
    return base64.b64decode(re.search(r"(?m)^DockState=(.+)$", ini).group(1))

class R:
    def __init__(self, b): self.b, self.p = b, 0
    def u8(self): v = self.b[self.p]; self.p += 1; return v
    def i32(self): v = struct.unpack_from(">i", self.b, self.p)[0]; self.p += 4; return v
    def qstr(self):
        n = struct.unpack_from(">I", self.b, self.p)[0]; self.p += 4
        if n == 0xFFFFFFFF: return ""
        s = self.b[self.p:self.p + n].decode("utf-16-be"); self.p += n; return s

def info(r, depth):
    pad = "  " * depth
    marker = r.u8()
    tab = ""
    if marker == 0xFA: tab = f" abas(atual={r.i32()})"
    o, n = r.u8(), r.i32()
    print(f"{pad}{'H' if o == 1 else 'V'}{tab} [{n}]")
    for _ in range(n):
        m = r.u8()
        if m == 0xFB:
            name, flags = r.qstr(), r.u8()
            a, b, c, d = r.i32(), r.i32(), r.i32(), r.i32()
            kind = "flutuante" if flags & 2 else ""
            print(f"{pad}  {name:22} {'visivel' if flags & 1 else 'oculto ':7} pos={a:5} tam={b:5} min={c:5} max={d} {kind}")
        elif m == 0xFC:
            a, b, c, d = r.i32(), r.i32(), r.i32(), r.i32()
            print(f"{pad}  grupo pos={a} tam={b} min={c} max={d}")
            info(r, depth + 2)
        else:
            raise SystemExit(f"marcador inesperado {m:#x} em {r.p}")

def dump(blob):
    r = R(blob)
    print("cabeçalho", r.i32(), "versão", r.i32(), "| bytes", len(blob))
    assert r.u8() == 0xFD
    for _ in range(r.i32()):
        area, w, h = r.i32(), r.i32(), r.i32()
        print(f"área {['esquerda', 'direita', 'topo', 'base'][area]} {w}x{h}")
        info(r, 1)
    print("central", r.i32(), "x", r.i32(), "| cantos", [r.i32() for _ in range(4)])

if __name__ == "__main__":
    dump(load(sys.argv[1]))
