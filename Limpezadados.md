# 🗑️ LIMPEZA DO BANCO DE DADOS

## Comando para deletar TODAS as respostas

### Windows (PowerShell)
```powershell
Invoke-WebRequest -Uri https://saude-solidaria-api.onrender.com/api/limpar -Method DELETE
Windows (CMD) / Linux / Mac
bash
curl -X DELETE https://saude-solidaria-api.onrender.com/api/limpar
✅ Resposta esperada
Banco com dados:

json
{"success":true,"message":"882 respostas foram deletadas com sucesso!","deletedCount":882}
Banco vazio:

json
{"success":true,"message":"Banco já estava vazio","deletedCount":0}
⚠️ ATENÇÃO
Esse comando APAGA TODOS OS DADOS permanentemente

Não tem como desfazer

Exporte um backup (CSV) antes de executar

🔗 Endpoint da API
DELETE https://saude-solidaria-api.onrender.com/api/limpar

text

---

## 📋 Como criar

1. No VS Code, na raiz do projeto, crie um novo arquivo
2. Nome: `LIMPEZA.md`
3. Cole o código acima
4. Salve
5. Commit e Push no GitHub Desktop

---

**Pronto! Um arquivo limpo, organizado e só sobre limpeza de dados.** 🚀