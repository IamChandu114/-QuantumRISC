# QuantumRISC Release Notes

## Release 1.0.0

QuantumRISC Studio v1.0.0 is a production release for RISC-V architecture exploration, RTL debugging, simulation analysis, and verification workflows.

### Highlights

- RV32I processor with a 5-stage pipeline
- FastAPI backend with websocket-driven live telemetry
- Backend-driven Studio for pipeline, register, memory, hazard, waveform, and performance analysis
- Real session lifecycle controls for discovery, compile, run, step, reset, and snapshot
- RTL Explorer and documentation surfaces backed by the project source tree
- Production deployment support for Vercel and Railway

### Technical note

The core Studio is driven by live backend state. Cache, branch prediction, verification, and FPGA analysis panels intentionally show unavailable states when the backend does not emit those metrics, rather than fabricating values.

### Repository

https://github.com/IamChandu114/-QuantumRISC
