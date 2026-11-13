# Servidor local de Cromanenos para Windows. So serve ficheiros estaticos
# deste cartafol a este mesmo ordenador (localhost). Non precisa instalacion
# nin permisos de administrador.
# (Mensaxes sen acentos a proposito: PowerShell 5 le mal os ficheiros sen BOM.)
param([int]$Port = 8765)

$root = Split-Path -Parent $PSScriptRoot
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.mp4'  = 'video/mp4'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host "Non se puido arrancar Cromanenos no porto $Port."
  Write-Host "Pode que xa estea aberto noutra xanela."
  Write-Host $_.Exception.Message
  exit 1
}

Write-Host "Cromanenos en marcha en http://localhost:$Port/"
Write-Host "Non peches esta xanela mentres o uses. Para parar, pecha a xanela."
Start-Process "http://localhost:$Port/"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '') { $rel = 'index.html' }
      $full = [IO.Path]::GetFullPath((Join-Path $root $rel))
      $inside = $full.StartsWith($root + [IO.Path]::DirectorySeparatorChar)
      if ($inside -and (Test-Path -LiteralPath $full -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($full)
        $ext = [IO.Path]::GetExtension($full).ToLower()
        if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] }
        else { $res.ContentType = 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store')
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
      }
    } catch {
      $res.StatusCode = 500
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
}
