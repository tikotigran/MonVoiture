# Скрипт запуска dev-сервера: подставляет Node в PATH и запускает pnpm/npm
Set-Location $PSScriptRoot

# 1. Подставить PATH из реестра пользователя (где часто прописан Node/nvm)
try {
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath) { $env:Path = "$userPath;$env:Path" }
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($machinePath) { $env:Path = "$machinePath;$env:Path" }
} catch {}

$nodePaths = @(
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "$env:LOCALAPPDATA\Programs\node",
    "$env:APPDATA\npm",
    "$env:USERPROFILE\scoop\shims",
    "$env:LOCALAPPDATA\Volta\bin",
    "$env:USERPROFILE\AppData\Roaming\npm",
    "$env:USERPROFILE\.fnm\current"
)
if ($env:NVM_HOME) { $nodePaths += $env:NVM_HOME }
if ($env:NVM_SYMLINK) { $nodePaths += $env:NVM_SYMLINK }
$nvmPath = "$env:APPDATA\nvm"
if (Test-Path $nvmPath) {
    $current = Get-Content "$nvmPath\alias\default" -ErrorAction SilentlyContinue
    if ($current) { $nodePaths += "$nvmPath\$current".Trim() }
    Get-ChildItem $nvmPath -Directory -Filter "v*" -ErrorAction SilentlyContinue | ForEach-Object { $nodePaths += $_.FullName }
}
foreach ($p in $nodePaths) {
    if ($p -and (Test-Path $p)) { $env:Path = "$p;$env:Path" }
}

# 2. Поиск node.exe в типичных папках (если всё ещё не найден)
$nodeExe = $null
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $searchDirs = @(
        "$env:ProgramFiles\nodejs",
        "${env:ProgramFiles(x86)}\nodejs",
        "$env:LOCALAPPDATA\Programs\node"
    )
    foreach ($dir in $searchDirs) {
        $exe = Join-Path $dir "node.exe"
        if (Test-Path $exe) { $nodeExe = $exe; break }
    }
    if (-not $nodeExe -and (Test-Path $nvmPath)) {
        foreach ($ver in (Get-ChildItem $nvmPath -Directory -Filter "v*" -ErrorAction SilentlyContinue)) {
            $exe = Join-Path $ver.FullName "node.exe"
            if (Test-Path $exe) { $nodeExe = $exe; break }
        }
    }
}

if (Get-Command pnpm -ErrorAction SilentlyContinue) { pnpm dev }
elseif (Get-Command npm -ErrorAction SilentlyContinue) { npm run dev }
elseif (Get-Command node -ErrorAction SilentlyContinue) {
    & node "node_modules\next\dist\bin\next" dev
}
elseif ($nodeExe) {
    $nodeDir = Split-Path $nodeExe -Parent
    $env:Path = "$nodeDir;$env:Path"
    $nextBin = Join-Path $PSScriptRoot "node_modules\next\dist\bin\next"
    if (Test-Path $nextBin) { & $nodeExe $nextBin dev }
    else { & $nodeExe (Join-Path $PSScriptRoot "node_modules\npm\bin\npm-cli.js") "run" "dev" }
}
else {
    Write-Host "Node/npm/pnpm not found. Install Node.js from https://nodejs.org"
    Write-Host "Or install and restart Cursor so PATH is updated."
    exit 1
}
