
---

## Estatísticas Hidrológicas Dinâmicas – API ANA

### Endpoint

```
POST /api/ana/estacoes/estatisticas
```

### Objetivo

Permite consultas flexíveis sobre estações hidrológicas, com filtros e agrupamentos customizados. Ideal para dashboards, relatórios e visualizações dinâmicas.

---

### Parâmetros (body JSON)

- **filtros**: Objeto com critérios de filtragem.  
  Exemplo: `{ "uf": ["MT", "GO"], "status": ["Atualizado"] }`
- **agruparPor**: Array de campos para agrupamento.  
  Exemplo: `["uf", "municipio"]`

Qualquer campo das estações pode ser usado (ex: `uf`, `municipio`, `status`, `tipo`, etc).

---

### Exemplo de Requisição

```json
{
  "filtros": { "uf": ["MT"], "status": ["Atualizado"] },
  "agruparPor": ["uf", "municipio"]
}
```

---

### Exemplo de Resposta

```json
{
  "total": 543,
  "agrupamento": {
    "MT|ALTA FLORESTA": [ /* ...estações... */ ],
    "MT|CUIABA": [ /* ...estações... */ ]
  }
}
```

- **total**: Quantidade de estações filtradas.
- **agrupamento**: Chave formada pelos campos do agrupamento, valor é array de estações.

---

### Casos de Uso

- Sem filtros, agrupando por UF:
  ```json
  { "agruparPor": ["uf"] }
  ```
- Filtrando por tipo e status, agrupando por município:
  ```json
  { "filtros": { "tipo": ["Pluviométrica"], "status": ["Atualizado"] }, "agruparPor": ["municipio"] }
  ```
- Sem agrupamento (array único):
  ```json
  { "filtros": { "uf": ["GO"] } }
  ```

---

### Integração Frontend (Exemplo)

```javascript
const response = await fetch('/api/ana/estatisticas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filtros: { uf: ['MT'], status: ['Atualizado'] },
    agruparPor: ['uf', 'municipio']
  })
});
const data = await response.json();
console.log(data.total, data.agrupamento);
```

---

### Observações

- Campos de filtro e agrupamento são livres, conforme estrutura das estações.
- O endpoint utiliza cache para performance.
- Em caso de erro, retorna status HTTP e mensagem detalhada.
- Ideal para visualizações customizadas e análises rápidas.

---
