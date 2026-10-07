# Test helper: close OBS source-properties windows (title starts with "Propriedades") left open by a panel action.
Add-Type @'
using System; using System.Text; using System.Runtime.InteropServices;
public static class PropWin {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  public static int CloseAll() {
    int n = 0;
    EnumWindows((h, l) => { var t = new StringBuilder(256); GetWindowText(h, t, 256); if (IsWindowVisible(h) && t.ToString().StartsWith("Propriedades")) { PostMessage(h, 0x0010, IntPtr.Zero, IntPtr.Zero); n++; } return true; }, IntPtr.Zero);
    return n;
  }
}
'@
"janelas de propriedades fechadas: $([PropWin]::CloseAll())"
