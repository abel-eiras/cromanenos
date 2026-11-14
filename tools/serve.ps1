# Servidor local de Cromanenos para Windows. Serve os ficheiros estaticos
# deste cartafol a este mesmo ordenador (localhost) e encargase das
# actualizacions. Non precisa instalacion nin permisos de administrador.
#
# A paxina non pode conectarse a internet. O unico que sae a rede e este
# programa, e so para preguntar cal e a ultima version publicada e
# descargala: peticions GET sen ningun dato da persoa nin dos seus videos.
#
# (Texto sen acentos a proposito: PowerShell 5 le mal os ficheiros sen BOM.)
param([int]$Port = 8765)

$ProgressPreference = 'SilentlyContinue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch { }

$root = Split-Path -Parent $PSScriptRoot
$updateBase = $env:CROMANENOS_UPDATE_BASE
if (-not $updateBase) { $updateBase = 'https://github.com/abel-eiras/cromanenos' }
$updateBase = $updateBase.TrimEnd('/')
$maxZip = 50MB
$maxUnpacked = 200MB

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.svg'  = 'image/svg+xml'
  '.mp4'  = 'video/mp4'
  ''      = 'text/plain; charset=utf-8'
}

# ------------------------------------------------------------- actualizacions
function Get-CurrentVersion {
  try {
    $v = [IO.File]::ReadAllText((Join-Path $root 'VERSION')).Trim()
    if ($v -match '^\d+\.\d+\.\d+$') { return $v }
  } catch { }
  return '0.0.0'
}

function Test-CanUpdate {
  # Nunha copia de desenvolvemento (con .git) non se toca nada.
  if (Test-Path -LiteralPath (Join-Path $root '.git')) { return $false }
  $probe = Join-Path $root ('.proba-' + [Guid]::NewGuid().ToString('N'))
  try {
    [IO.File]::WriteAllText($probe, '')
    [IO.File]::Delete($probe)
    return $true
  } catch {
    return $false
  }
}

# Ultima version publicada: seguese a redireccion de /releases/latest.
function Get-LatestVersion {
  $r = Invoke-WebRequest -Uri "$updateBase/releases/latest" -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 5 -UserAgent 'Cromanenos'
  $final = $null
  if ($r.BaseResponse.ResponseUri) { $final = $r.BaseResponse.ResponseUri.AbsoluteUri }
  elseif ($r.BaseResponse.RequestMessage) { $final = $r.BaseResponse.RequestMessage.RequestUri.AbsoluteUri }
  if (-not $final) { return $null }
  $final = ($final -split '\?')[0]
  if ($final -match '/releases/tag/v(\d+\.\d+\.\d+)/?$') { return $Matches[1] }
  return $null
}

function Get-UpdateInfo {
  try {
    $current = Get-CurrentVersion
    $latest = Get-LatestVersion
    if (-not $latest) { return @{ ok = $false } }
    return @{ ok = $true; current = $current; latest = $latest; available = ([version]$latest -gt [version]$current) }
  } catch {
    return @{ ok = $false }
  }
}

# Valida o ZIP enteiro antes de tocar nada.
function Test-UpdateZip([string]$zipPath, [string]$version) {
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    $total = 0
    $hasIndex = $false
    $zipVersion = $null
    foreach ($entry in $archive.Entries) {
      $name = $entry.FullName
      if (-not $name.StartsWith('cromanenos/')) { return $false }
      if ($name.Contains('\') -or $name.Contains(':')) { return $false }
      if (($name -split '/') -contains '..') { return $false }
      $total += $entry.Length
      if ($total -gt $maxUnpacked) { return $false }
      if ($name -eq 'cromanenos/index.html') { $hasIndex = $true }
      if ($name -eq 'cromanenos/VERSION') {
        $reader = New-Object IO.StreamReader($entry.Open())
        try { $zipVersion = $reader.ReadToEnd().Trim() } finally { $reader.Dispose() }
      }
    }
    return ($hasIndex -and ($zipVersion -eq $version))
  } finally {
    $archive.Dispose()
  }
}

function Install-Update {
  if (-not (Test-CanUpdate)) { return @{ ok = $false } }
  $info = Get-UpdateInfo
  if (-not $info.ok -or -not $info.available) { return @{ ok = $false } }
  $version = $info.latest
  $tmp = Join-Path $root ('.actualizacion-' + [Guid]::NewGuid().ToString('N'))
  try {
    [void](New-Item -ItemType Directory -Path $tmp)
    $zip = Join-Path $tmp 'cromanenos.zip'
    Invoke-WebRequest -Uri "$updateBase/releases/download/v$version/cromanenos-v$version.zip" -OutFile $zip -UseBasicParsing -TimeoutSec 60 -UserAgent 'Cromanenos'
    if ((Get-Item -LiteralPath $zip).Length -gt $maxZip) { return @{ ok = $false } }
    if (-not (Test-UpdateZip $zip $version)) { return @{ ok = $false } }

    $out = Join-Path $tmp 'novo'
    Expand-Archive -LiteralPath $zip -DestinationPath $out -Force
    $src = Join-Path $out 'cromanenos'
    # So se substituen os ficheiros que venen no ZIP; o resto non se toca.
    # VERSION vai ao final: se algo falla a medias, volvese intentar.
    $files = @(Get-ChildItem -LiteralPath $src -Recurse -File)
    foreach ($f in $files) {
      $rel = $f.FullName.Substring($src.Length + 1)
      if ($rel -eq 'VERSION') { continue }
      $dest = Join-Path $root $rel
      $dir = Split-Path -Parent $dest
      if (-not (Test-Path -LiteralPath $dir)) { [void](New-Item -ItemType Directory -Path $dir -Force) }
      # iniciar.bat esta en marcha: so se cambia se de verdade e distinto.
      if ($rel -eq 'iniciar.bat' -and (Test-Path -LiteralPath $dest)) {
        if ([IO.File]::ReadAllText($dest) -eq [IO.File]::ReadAllText($f.FullName)) { continue }
      }
      Copy-Item -LiteralPath $f.FullName -Destination $dest -Force
    }
    Copy-Item -LiteralPath (Join-Path $src 'VERSION') -Destination (Join-Path $root 'VERSION') -Force
    return @{ ok = $true; version = $version }
  } catch {
    # Rede, proxy, TLS, ZIP estragado... nunca e motivo de alarma.
    return @{ ok = $false }
  } finally {
    if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue }
  }
}

# ------------------------------------------------------------------- servidor
function Send-Json($res, $obj, [int]$status = 200) {
  $bytes = [Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Compress))
  $res.StatusCode = $status
  $res.ContentType = 'application/json'
  $res.ContentLength64 = $bytes.Length
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
}

# A API so responde a propia paxina de Cromanenos.
function Test-SameOrigin($req) {
  $origin = $req.Headers['Origin']
  if ($origin -and ($origin -ne "http://localhost:$Port")) { return $false }
  $site = $req.Headers['Sec-Fetch-Site']
  if ($site -and ($site -ne 'same-origin') -and ($site -ne 'none')) { return $false }
  return $true
}

function Invoke-Api($req, $res) {
  $path = $req.Url.AbsolutePath
  $method = $req.HttpMethod
  if (-not (Test-SameOrigin $req)) { Send-Json $res @{ ok = $false } 403 }
  elseif ($method -eq 'GET' -and $path -eq '/api/version') {
    Send-Json $res @{ version = (Get-CurrentVersion); canUpdate = (Test-CanUpdate) }
  }
  elseif ($method -eq 'POST' -and $path -eq '/api/update/check') { Send-Json $res (Get-UpdateInfo) }
  elseif ($method -eq 'POST' -and $path -eq '/api/update/apply') { Send-Json $res (Install-Update) }
  else { Send-Json $res @{ ok = $false } 404 }
}

# Atallo "Cromanenos" coa icona, neste mesmo cartafol. Refaise en cada arranque
# para que siga valendo se se move o cartafol. Pode copiarse ao escritorio.
try {
  $shell = New-Object -ComObject WScript.Shell
  $link = $shell.CreateShortcut((Join-Path $root 'Cromanenos.lnk'))
  $link.TargetPath = Join-Path $root 'iniciar.bat'
  $link.WorkingDirectory = $root
  $link.IconLocation = Join-Path $root 'icons\cromanenos.ico'
  $link.Description = 'Cromanenos'
  $link.Save()
} catch {
  # Sen atallo tamen funciona.
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
    $req = $ctx.Request
    $res = $ctx.Response
    try {
      $res.Headers.Add('Cache-Control', 'no-store')
      $res.Headers.Add('X-Cromanenos', 'launcher')  # a paxina sabe asi que hai lanzador
      $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
      if ($rel.StartsWith('api/')) {
        Invoke-Api $req $res
      } elseif ($req.HttpMethod -ne 'GET') {
        $res.StatusCode = 405
      } else {
        if ($rel -eq '') { $rel = 'index.html' }
        $full = [IO.Path]::GetFullPath((Join-Path $root $rel))
        $inside = $full.StartsWith($root + [IO.Path]::DirectorySeparatorChar)
        if ($inside -and (Test-Path -LiteralPath $full -PathType Leaf)) {
          $bytes = [IO.File]::ReadAllBytes($full)
          $ext = [IO.Path]::GetExtension($full).ToLower()
          if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] }
          else { $res.ContentType = 'application/octet-stream' }
          $res.ContentLength64 = $bytes.Length
          $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
          $res.StatusCode = 404
        }
      }
    } catch {
      try { $res.StatusCode = 500 } catch { }
    } finally {
      try { $res.Close() } catch { }
    }
  }
} finally {
  $listener.Stop()
}
