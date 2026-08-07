#!/usr/bin/env bash
ss -tlnp | grep -E ':3000|:5173' || echo 'Nada ouvindo em 3000/5173'
curl -sS --connect-timeout 1 http://127.0.0.1:3000/health || echo 'API down'
echo
curl -sS -o /dev/null -w 'web %{http_code}\n' --connect-timeout 1 http://127.0.0.1:5173/ || echo 'Web down'
