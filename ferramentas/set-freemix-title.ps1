# Keeps the portable OBS main window titled "FreeMix - <collection> - <res>p<fps>".
# Resolution and frame rate come from the active profile, the collection from user.ini.
# OBS rewrites its own title on some events (profile/collection change), so this re-applies it every 2 s
# and exits by itself when this folder's OBS closes. Only the window caption changes; nothing inside OBS.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$cfg = Join-Path $root 'config\obs-studio'

function IniValue([string]$file, [string]$key) {
  if (-not (Test-Path $file)) { return $null }
  $m = Select-String -Path $file -Pattern "^$key=(.*)$" | Select-Object -First 1
  if ($m) { $m.Matches[0].Groups[1].Value.Trim() } else { $null }
}
function BuildTitle {
  $user = Join-Path $cfg 'user.ini'
  $coll = IniValue $user 'SceneCollection'
  $prof = IniValue $user 'Profile'
  $basic = Join-Path $cfg "basic\profiles\$prof\basic.ini"
  $h = IniValue $basic 'OutputCY'
  $num = IniValue $basic 'FPSNum'; $den = IniValue $basic 'FPSDen'; $type = IniValue $basic 'FPSType'
  $fps = $null
  if ($type -eq '2' -and $num -and $den) { $fps = [math]::Round([double]$num / [double]$den, 2) }
  elseif ($type -eq '1') { $fps = IniValue $basic 'FPSInt' }
  else { $fps = IniValue $basic 'FPSCommon' }
  $parts = @('FreeMix')
  if ($coll) { $parts += $coll }
  if ($h -and $fps) { $parts += "${h}p$fps" }
  $parts -join ' - '
}

Add-Type @'
using System; using System.Text; using System.Runtime.InteropServices;
public static class FmWin {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern bool SetWindowText(IntPtr h, string s);
  [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
  [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)] public static extern IntPtr LoadImage(IntPtr hinst, string lpszName, uint uType, int cxDesired, int cyDesired, uint fuLoad);

  public const uint WM_SETICON = 0x0080;
  public const uint ICON_SMALL = 0;
  public const uint ICON_BIG = 1;
  public const uint IMAGE_ICON = 1;
  public const uint LR_LOADFROMFILE = 0x00000010;

  // Main OBS window of the given process: the visible top-level window whose title starts with "OBS " or "FreeMix".
  public static IntPtr Main(uint procId) {
    IntPtr found = IntPtr.Zero;
    EnumWindows((h, l) => {
      uint p; GetWindowThreadProcessId(h, out p);
      if (p != procId || !IsWindowVisible(h)) return true;
      var sb = new StringBuilder(512); GetWindowText(h, sb, 512); var t = sb.ToString();
      if (t.StartsWith("OBS ") || t.StartsWith("FreeMix")) { found = h; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }
  public static string Text(IntPtr h) { var sb = new StringBuilder(512); GetWindowText(h, sb, 512); return sb.ToString(); }

  public static void ApplyIcon(IntPtr hWnd, string iconPath) {
    if (string.IsNullOrEmpty(iconPath) || !System.IO.File.Exists(iconPath)) return;
    IntPtr hSmall = LoadImage(IntPtr.Zero, iconPath, IMAGE_ICON, 16, 16, LR_LOADFROMFILE);
    IntPtr hBig = LoadImage(IntPtr.Zero, iconPath, IMAGE_ICON, 32, 32, LR_LOADFROMFILE);
    if (hSmall != IntPtr.Zero) SendMessage(hWnd, WM_SETICON, (IntPtr)ICON_SMALL, hSmall);
    if (hBig != IntPtr.Zero) SendMessage(hWnd, WM_SETICON, (IntPtr)ICON_BIG, hBig);
  }
}
'@

$exe = Join-Path $root 'bin\64bit\obs64.exe'
$ico = Join-Path $PSScriptRoot 'freemix.ico'
$deadline = (Get-Date).AddSeconds(40)
$proc = $null
while (-not $proc -and (Get-Date) -lt $deadline) {
  $proc = Get-Process obs64 -ErrorAction SilentlyContinue | Where-Object { $_.Path -ieq $exe } | Select-Object -First 1
  if (-not $proc) { Start-Sleep -Milliseconds 300 }
}
if (-not $proc) { exit 0 }

$iconApplied = $false
while (-not $proc.HasExited) {
  $h = [FmWin]::Main([uint32]$proc.Id)
  if ($h -ne [IntPtr]::Zero) {
    $want = BuildTitle
    if ([FmWin]::Text($h) -ne $want) { [FmWin]::SetWindowText($h, $want) | Out-Null }
    if (-not $iconApplied -and (Test-Path $ico)) {
      [FmWin]::ApplyIcon($h, $ico)
      $iconApplied = $true
    }
  }
  Start-Sleep -Milliseconds 1200
  $proc.Refresh()
}

