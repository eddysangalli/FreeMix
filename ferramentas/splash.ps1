# FreeMix opening screen. Shown while the portable OBS starts; closes as soon as this folder's OBS main
# window is visible (or after 25 s). The bar is an indeterminate animation: it does not pretend to know progress.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $root 'bin\64bit\obs64.exe'
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        Title="FreeMix" Height="340" Width="600" WindowStartupLocation="CenterScreen" WindowStyle="None"
        AllowsTransparency="True" Background="Transparent" ShowInTaskbar="False" Topmost="True" ResizeMode="NoResize">
  <Border CornerRadius="10" BorderThickness="1" Background="#12161d">
    <Border.BorderBrush>
      <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
        <GradientStop Color="#f7931e" Offset="0"/><GradientStop Color="#2a3442" Offset="0.5"/><GradientStop Color="#16a014" Offset="1"/>
      </LinearGradientBrush>
    </Border.BorderBrush>
    <Border.Effect><DropShadowEffect Color="#000000" BlurRadius="28" ShadowDepth="6" Opacity="0.8"/></Border.Effect>
    <Grid Margin="30,26,30,22">
      <Grid.RowDefinitions><RowDefinition Height="*"/><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/></Grid.RowDefinitions>
      <StackPanel Grid.Row="0" VerticalAlignment="Center" HorizontalAlignment="Center">
        <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
          <Grid Width="54" Height="54" Margin="0,0,16,0">
            <Rectangle RadiusX="6" RadiusY="6" Width="25" Height="25" Fill="#f7931e" HorizontalAlignment="Left" VerticalAlignment="Top"/>
            <Rectangle RadiusX="6" RadiusY="6" Width="25" Height="25" Fill="#16a014" HorizontalAlignment="Right" VerticalAlignment="Top"/>
            <Rectangle RadiusX="6" RadiusY="6" Width="25" Height="25" Fill="#3c4858" HorizontalAlignment="Left" VerticalAlignment="Bottom"/>
            <Rectangle RadiusX="6" RadiusY="6" Width="25" Height="25" Fill="#c8281e" HorizontalAlignment="Right" VerticalAlignment="Bottom"/>
          </Grid>
          <TextBlock VerticalAlignment="Center" FontFamily="Segoe UI" FontSize="50" FontWeight="Black">
            <Run Text="Free" Foreground="#ffffff"/><Run Text="Mix" Foreground="#f7931e"/>
          </TextBlock>
        </StackPanel>
        <TextBlock Text="MESA DE CORTE AO VIVO" Foreground="#8b97a8" FontFamily="Segoe UI" FontSize="12" FontWeight="SemiBold" HorizontalAlignment="Center" Margin="0,10,0,0"/>
      </StackPanel>
      <StackPanel Grid.Row="1" Margin="0,0,0,14">
        <TextBlock Name="Status" Text="Abrindo o motor de video..." Foreground="#9fb0c6" FontFamily="Segoe UI" FontSize="12" Margin="0,0,0,7"/>
        <Border Height="5" Background="#0a0d12" CornerRadius="2" ClipToBounds="True">
          <Canvas Name="Track" ClipToBounds="True">
            <Rectangle Name="Bar" Width="140" Height="5" RadiusX="2" RadiusY="2">
              <Rectangle.Fill>
                <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                  <GradientStop Color="#00f7931e" Offset="0"/><GradientStop Color="#f7931e" Offset="0.5"/><GradientStop Color="#0016a014" Offset="1"/>
                </LinearGradientBrush>
              </Rectangle.Fill>
            </Rectangle>
          </Canvas>
        </Border>
      </StackPanel>
      <Grid Grid.Row="2">
        <TextBlock Text="Motor: OBS Studio (GPL-2.0)" Foreground="#4f5c6e" FontFamily="Segoe UI" FontSize="10.5"/>
        <TextBlock Text="modo portatil" Foreground="#4f5c6e" FontFamily="Segoe UI" FontSize="10.5" HorizontalAlignment="Right"/>
      </Grid>
    </Grid>
  </Border>
</Window>
"@

$window = [System.Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader $xaml))
$bar = $window.FindName('Bar'); $status = $window.FindName('Status')
$started = Get-Date
$pos = -140.0
$timer = New-Object System.Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromMilliseconds(30)
$timer.Add_Tick({
  $script:pos += 9; if ($script:pos -gt 560) { $script:pos = -140 }
  [System.Windows.Controls.Canvas]::SetLeft($bar, $script:pos)
  $elapsed = ((Get-Date) - $started).TotalSeconds
  $p = Get-Process obs64 -ErrorAction SilentlyContinue | Where-Object { $_.Path -ieq $exe } | Select-Object -First 1
  if ($p) { $status.Text = 'Carregando cenas e painel...' }
  if (($p -and $p.MainWindowHandle -ne [IntPtr]::Zero -and $elapsed -gt 1.5) -or $elapsed -gt 25) { $timer.Stop(); $window.Close() }
})
$window.Add_Loaded({ $timer.Start() })
$window.ShowDialog() | Out-Null
