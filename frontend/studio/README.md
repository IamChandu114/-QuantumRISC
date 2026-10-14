# QuantumRISC Studio

QuantumRISC Studio is the RV32I microarchitecture engineering workbench.

It renders authoritative data from the QuantumRISC FastAPI backend: Icarus
Verilog compilation, VVP simulation, VCD parsing, pipeline state, registers,
memory, hazards, forwarding, waveforms, metrics, and verification output.
When the backend is unavailable, views display an explicit diagnostic or
no-data state; the Studio never generates simulated engineering telemetry.

## Backend integration

The application has one backend-driven state model:

- `src/lib/backend-endpoint.ts` resolves `VITE_API_URL` and safely derives WS.
- `src/lib/api-client.ts` implements the REST contract.
- `src/lib/ws-client.ts` manages session WebSocket connection and recovery.
- `src/store/studio-store.ts` is the authoritative state consumed by all views.

The actual backend routes are:

- `GET /api/health`
- `GET /api/discovery`
- `POST /api/sessions`
- `POST /api/sessions/{id}/compile`
- `POST /api/sessions/{id}/run`
- `POST /api/sessions/{id}/pause`, `/resume`, `/step`, and `/reset`
- `GET /api/sessions/{id}/snapshot`
- `WS /ws/sessions/{id}`

## Development

```bash
cd frontend/studio
npm install
npm run dev
```

The Vite development server proxies API and WebSocket traffic to
`http://127.0.0.1:8000`. Production uses `VITE_API_URL` when configured,
otherwise it uses the same FastAPI origin serving `/studio`.

```bash
npm run build
```

The backend serves `dist/index.html` at `/studio`.

Start the backend with its normal procedure:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
