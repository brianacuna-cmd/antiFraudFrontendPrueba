# Frontend Integration Spec — Fraud pipeline (score → case)

Contratos extraídos del código (`develop`). Todo bajo el prefijo **`/api/v1`**.
Base URL local por defecto: `http://localhost:3000/api/v1` (ajustá el puerto a tu `.env`).

---

## 0. Autenticación

Todas las rutas de negocio requieren un `AuthContext`. Hay dos modos (env `AUTH_MODE`):

### A) Modo demo local — `AUTH_MODE=trusted-header` (recomendado para el mini-frontend)
No necesitás login. Mandás estos headers en CADA request:

```
x-actor-user-id: <cualquier ObjectId hex de 24 chars, ej: 000000000000000000000001>
x-actor-organization-id: <ObjectId hex de la org, ej: 0000000000000000000000aa>
```

- `x-actor-user-id` es obligatorio; sin él, el request llega sin auth → 401.
- `x-actor-organization-id` define el tenant. Usá el MISMO valor para todo (org, reglas, config, eventos) o no se cruzan los datos.
- `assertAuthConfigSafeForProduction` **impide** arrancar en prod con este modo. Es solo para dev/staging.

### B) Modo real — `AUTH_MODE=session` (JWT Bearer)
Login de organización (single-step, sin MFA):

```
POST /api/v1/auth/organizations/login
Content-Type: application/json

{ "email": "admin@org.com", "password": "..." }
```
Respuesta `200`:
```json
{ "accessToken": "…", "refreshToken": "…|null", "expiresAt": "2026-08-18T01:00:00.000Z" }
```
Después, en cada request:
```
Authorization: Bearer <accessToken>
```
(El login de USER es two-step con MFA: `POST /auth/users/login` → `{ status, challengeToken }` → `POST /auth/users/mfa` con `{ challengeToken, totp }`. Para tu demo usá el de **organizations** o el modo trusted-header.)

> Para el resto de la spec asumo que ya resolviste auth por A o B. Notación `AUTH` = esos headers.

---

## 1. Orden de setup (obligatorio, una sola vez por org)

```
1. PUT  /organization-fraud-config     ← define umbrales. SIN ESTO no se abre ningún caso.
2. POST /risk-scoring-rules            ← crea la regla JDM (draft, INACTIVE)
3. POST /risk-scoring-rules/:id/activate ← la activa (ACTIVE)
```
Recién después, los eventos disparan casos.

---

## 2. Endpoints

### 2.1 Config de fraude (umbrales) — REQUISITO

**`PUT /organization-fraud-config`**  · headers: `AUTH`
Body (todos los campos requeridos, enteros ≥ 0; `.strict()`):
```json
{
  "slaLowMinutes": 1440,
  "slaMediumMinutes": 480,
  "slaHighMinutes": 120,
  "slaCriticalMinutes": 30,
  "riskThresholdLow": 40,
  "riskThresholdMedium": 60,
  "riskThresholdHigh": 80,
  "riskThresholdCritical": 95,
  "featureFlags": { "someFlag": true },
  "outboundWebhookUrl": null
}
```
`featureFlags` y `outboundWebhookUrl` son opcionales. Respuesta `200` = la config.

**Cómo mapea el score a prioridad** (define si nace el caso):
```
score >= riskThresholdCritical → CRITICAL
score >= riskThresholdHigh     → HIGH
score >= riskThresholdMedium   → MEDIUM
score >= riskThresholdLow      → LOW
score <  riskThresholdLow       → null  → NO se abre caso (opened:false)
```

**`GET /organization-fraud-config`** · headers: `AUTH` → `200` la config (404 si no existe).

---

### 2.2 Reglas de scoring (editor GoRules)

**`POST /risk-scoring-rules`** · headers: `AUTH` · `.strict()`
```json
{
  "name": "Wallet transfer risk v1",
  "conditions": { /* grafo JDM completo — ver §4 */ },
  "conditionsVersion": 1
}
```
- `conditions` = el JSON que exporta el editor GoRules (contentType `application/vnd.gorules.decision`, con `nodes[]` y `edges[]`). Solo se valida la ESTRUCTURA, no la semántica.
- `conditionsVersion` opcional (entero ≥ 0).
- Respuesta `201`: la regla en estado **`INACTIVE`** (draft).

**`POST /risk-scoring-rules/:id/activate`** · headers: `AUTH` → `200`, regla en **`ACTIVE`**.

**`GET /risk-scoring-rules`** · `AUTH` → `{ "items": [ ...reglas ] }`
**`GET /risk-scoring-rules/:id`** · `AUTH` → la regla.

Shape de respuesta de una regla:
```json
{
  "id": "…", "organizationId": "…", "name": "…",
  "conditions": { /* grafo JDM */ },
  "conditionsVersion": 1,
  "status": "INACTIVE | ACTIVE",
  "createdAt": "ISO", "updatedAt": "ISO"
}
```

---

### 2.3 Disparar el pipeline (tu "mini ingestor")

**`POST /risk-scores/process`** · headers: `AUTH`  ← **ESTE abre el caso**
Body = `CanonicalRiskEvent`, **camelCase estricto** (rechaza snake_case y campos extra):
```json
{
  "provider": "internal",
  "providerEventType": "wallet.transfer",
  "caseCustomerId": "cust-123",
  "amountCents": 500000,
  "currency": "USD",
  "riskSignals": { "walletAgeDays": 2, "velocity24h": 9, "destCountry": "XX" },
  "createdAt": "2026-08-18T00:00:00.000Z",
  "eventId": "evt-abc",
  "providerEventId": "prov-1",
  "rail": "crypto",
  "rawPayload": { "cualquier": "cosa cruda" }
}
```
Requeridos: `provider`, `providerEventType`, `caseCustomerId`, `amountCents` (number), `currency`, `riskSignals` (objeto), `createdAt` (ISO datetime).
Opcionales: `eventId`, `providerEventId`, `rail`, `rawPayload` (se usa internamente, NO se devuelve).

Respuesta `200`:
```json
{
  "riskScore": 82,
  "ruleId": "…",
  "conditionsVersion": 1,
  "opened": true,
  "caseId": "…",
  "priority": "HIGH"
}
```
Si `opened:false` → el score quedó bajo `riskThresholdLow`, no hay `caseId`.

**`POST /risk-scores`** (mismo body) → solo calcula, **no** abre caso:
```json
{ "riskScore": 82, "ruleId": "…", "name": "…", "conditionsVersion": 1 }
```

> **Qué recibe la regla como `context`:** el evento completo (incluye `amountCents`, `currency`, `riskSignals`, etc., pero SIN `rawPayload`). Tu grafo JDM lee esos campos.

---

### 2.4 Ver / operar casos (para el panel)

Todos con headers `AUTH`.

| Método | Ruta | Qué hace |
|---|---|---|
| `GET`  | `/cases` | lista paginada (query params abajo) → `{ items, total }` |
| `POST` | `/cases` | alta manual de caso |
| `GET`  | `/cases/:caseId` | ficha del caso |
| `GET`  | `/cases/:caseId/timeline` | eventos → `{ items }` |
| `POST` | `/cases/:caseId/notes` | agrega nota `{ "body": "…" }` |
| `GET`  | `/cases/:caseId/notes` | lista notas |
| `POST` | `/cases/:caseId/start-review` | pasa a revisión |
| `POST` | `/cases/:caseId/resolve` | resuelve `{ "reason": "…" }` |
| `POST` | `/cases/:caseId/archive` | archiva `{ "reason": "…" }` |
| `POST` | `/cases/:caseId/reassign` | reasigna |
| `POST` | `/cases/:caseId/reopen` | reabre |

**`GET /cases` query params** (todos opcionales): `status`, `priority`, `assignedTo`,
`riskScoreMin`, `riskScoreMax`, `tags`, `dueAfter`, `dueBefore`, `limit`, `offset`.

**Evidencia** (multipart) — headers `AUTH`:
- `POST /cases/:caseId/evidence` → `multipart/form-data`, campo **`file`**. Opcional `?investigationId=…`. → `201`.
- `GET /cases/:caseId/evidence` → lista.
- `GET /evidence/:evidenceId` → metadata.
- `GET /evidence/:evidenceId/download` → descarga el blob.

---

## 3. Flujo end-to-end de tu demo

```
[Frontend GoRules editor]
   └─ PUT /organization-fraud-config      (umbrales)   ── una vez
   └─ POST /risk-scoring-rules            (grafo JDM)
   └─ POST /risk-scoring-rules/:id/activate

[Mini ingestor de JSON]
   └─ POST /risk-scores/process  { CanonicalRiskEvent }  ── por cada transferencia
            → { opened:true, caseId, priority }

[Panel de casos]
   └─ GET /cases            (lista)
   └─ GET /cases/:id        (ficha + score + prioridad + SLA)
   └─ GET /cases/:id/timeline
```

---

## 4. Contrato del grafo JDM (GoRules)

El editor GoRules exporta un JSON con esta forma mínima (lo demás pasa `passthrough`):
```json
{
  "contentType": "application/vnd.gorules.decision",
  "nodes": [
    { "id": "req",  "type": "inputNode",  "name": "Request" },
    { "id": "expr", "type": "expressionNode", "name": "Score",
      "content": { "expressions": [ { "key": "riskScore", "value": "..." } ] } },
    { "id": "res",  "type": "outputNode", "name": "Response" }
  ],
  "edges": [
    { "id": "e1", "sourceId": "req",  "targetId": "expr" },
    { "id": "e2", "sourceId": "expr", "targetId": "res" }
  ]
}
```

**Regla de oro del output (fail-closed):**
- El grafo DEBE producir en su salida un campo **`riskScore` entero**. Si falta o no es entero → error (no se calcula, no se abre caso).
- Opcionalmente puede emitir `hits` (array, de un collect node) → se congela como evidencia. Si no hay, default `[]`.
- El `context` de entrada es el evento (sin `rawPayload`): tu expresión referencia `amountCents`, `currency`, `riskSignals.velocity24h`, etc.

Ejemplo de expresión que sube el score:
```
riskScore = (amountCents > 300000 ? 50 : 0) + (riskSignals.velocity24h > 5 ? 40 : 0)
```
Con umbral `high=80`, ese evento (amount 500000 + velocity 9) da 90 → `CRITICAL`/`HIGH` → caso abierto.

---

## 5. Errores comunes

| Síntoma | Causa | Fix |
|---|---|---|
| `opened:false` siempre | score < `riskThresholdLow` o falta la config | setear `PUT /organization-fraud-config` con umbrales bajos |
| `ORGANIZATION_FRAUD_CONFIG_NOT_FOUND` | nunca hiciste el PUT de config | hacelo primero |
| 400 en `/risk-scores/process` | body con snake_case o campo extra | usar camelCase exacto de §2.3 |
| `scoring engine output riskScore must be an integer` | el JDM no emite `riskScore` entero | corregir el grafo (§4) |
| 401 | falta `x-actor-user-id` / Bearer | ver §0 |
| no aparece la regla al scorear | la dejaste INACTIVE | `POST /:id/activate` |
