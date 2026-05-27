# Device Farm

Listagem, reserva e visualização de devices Android físicos plugados em máquinas remotas.

## Arquitetura

```
 ┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
 │   dashboard  │◀────▶│  postgres    │      │   node-agent(s)  │
 │  API + UI    │  pg  │ public       │      │   Express :4724  │
 │              │      │ auth         │◀────▶│   Executa ADB    │
 │              │      │ device_farm  │ REST │   Roda no host   │
 └──────────────┘      └──────────────┘      └──────────────────┘
                                            (hub-and-spoke)
```

- **Dashboard** (`app/`) = hub. Autentica usuários, mantém locks, agrega devices.
- **node-agent** (`node-agent/`) = spoke. Stateless, executa ADB local.
- **Postgres** = source of truth do farm (nodes, devices, locks, audit).

## Fluxos

### Registro de node-agent

```
[agent boot]
   getDevices()   (adb devices -l + getprop)
   ↓
   POST ${DASHBOARD_URL}/api/nodes/register {name, public_url, version, devices[]}
   ↓
[api/nodes.js]
   INSERT/UPDATE device_farm.t_node
   bulk UPSERT device_farm.t_device
   ↓
[agent]
   setInterval(30s) POST /api/nodes/heartbeat
```

### Listagem agregada

```
[UI DeviceFarm.jsx] (polling 5s)
   GET /api/devicefarm/devices
   ↓
[api/devicefarm.js]
   SELECT t_node WHERE last_heartbeat > NOW() - 60s
   Promise.allSettled(axios.get(node.public_url + '/agent/devices', timeout=3s))
   LEFT JOIN t_device_lock (lock ativo + locked_by)
   cache in-memory 3s (invalidado em lock/unlock)
```

### Reservar device (lock)

```
[UI] click "Reservar device" → POST /api/devicefarm/devices/:udid/lock
[api/devicefarm.js]
   BEGIN
   SELECT … FROM t_device_lock WHERE udid=$1 FOR UPDATE
     → expires_at > NOW(): ROLLBACK + 409 "Device já em uso"
   INSERT/UPDATE t_device_lock (TTL 5 min)
   COMMIT
[UI] navigate(/device-farm/:udid)
     setInterval(30s) POST /lock/renew  (keepalive)
```

Liberação:
- Manual: `DELETE /lock` → INSERT em `t_farm_session` (reason='manual_release')
- TTL: cron 60s do API: `DELETE FROM t_device_lock WHERE expires_at < NOW()` + audit (reason='ttl_expired')
- Admin force: `DELETE /lock?force=true` → audit (reason='admin_force')

### Screenshot

Proxy autenticado:

```
<img src> (no Authorization header)
   → não dá! Substituído por fetch autenticado:
[UI] deviceFarmAPI.screenshotBlob(udid)  →  Blob  →  URL.createObjectURL
   GET /api/devicefarm/devices/:udid/screenshot  (Authorization: Bearer …)
   ↓
[api/devicefarm.js]
   SELECT n.public_url FROM t_device JOIN t_node
   axios.get(`${public_url}/agent/devices/:udid/screenshot`, arraybuffer)
   res.send(buf) com Content-Type: image/png
   ↓
[node-agent]
   adb -s ${udid} exec-out screencap -p
```

## Endpoints

| Método | Path | Auth | Propósito |
|---|---|---|---|
| POST | /api/nodes/register | público | Agent anuncia devices |
| POST | /api/nodes/heartbeat | público | Agent pulsa devices |
| GET | /api/nodes | JWT | Lista agents registrados |
| DELETE | /api/nodes/:id | admin | Desregistra agent |
| GET | /api/devicefarm/devices | JWT | Listagem agregada (fan-out + cache 3s) |
| GET | /api/devicefarm/devices/:udid | JWT | Detalhe de 1 device |
| POST | /api/devicefarm/devices/:udid/lock | JWT | Reserva (FOR UPDATE, TTL 5min) |
| POST | /api/devicefarm/devices/:udid/lock/renew | JWT | Keepalive |
| DELETE | /api/devicefarm/devices/:udid/lock | JWT | Libera (`?force=true` p/ admin) |
| GET | /api/devicefarm/devices/:udid/screenshot | JWT | PNG (proxy) |
| GET | /api/devicefarm/sessions | JWT | Audit log |

## Como ver o estado em runtime

```bash
# Quem registrou
docker exec -it qa-track psql -U postgres -d qa_test_track -c \
  "SELECT name, public_url, last_heartbeat, last_heartbeat > NOW() - INTERVAL '60 seconds' AS online FROM device_farm.t_node;"

# Locks ativos
docker exec -it qa-track psql -U postgres -d qa_test_track -c \
  "SELECT l.udid, u.username, l.expires_at FROM device_farm.t_device_lock l JOIN auth.t_user u ON u.id = l.user_id;"

# Histórico
docker exec -it qa-track psql -U postgres -d qa_test_track -c \
  "SELECT * FROM device_farm.t_farm_session ORDER BY ended_at DESC LIMIT 10;"
```

Ver também [`node-agent/README.md`](../node-agent/README.md) para instalar um agent em uma máquina nova.
