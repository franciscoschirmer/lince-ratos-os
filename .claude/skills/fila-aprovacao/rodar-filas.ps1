# Roda as duas filas neste computador (Agendador de Tarefas do Windows, seg-sex 10h e 16h30).
# Usa o token do .env da raiz. O log fica em ultima-execucao.log (fora do git), sem o token.
$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
Set-Location $repo
$log = Join-Path $PSScriptRoot 'ultima-execucao.log'
$script = '.claude\skills\fila-aprovacao\fila.mjs'
"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" | Out-File $log -Append -Encoding utf8
foreach ($modo in @(@('postar'), @('revisao', 'postar'))) {
  $saida = & node $script @modo 2>&1 | Where-Object { $_ -notmatch 'pk_' }
  $saida | Select-Object -Last 3 | Out-File $log -Append -Encoding utf8
  if ($LASTEXITCODE -ne 0) { "ERRO no modo $($modo -join ' ') (codigo $LASTEXITCODE)" | Out-File $log -Append -Encoding utf8 }
}
