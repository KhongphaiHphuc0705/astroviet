# Swiss Ephemeris License Record

## 1. Package Identity
- **Package Name:** `swisseph-wasm`
- **Version Pin:** `0.1.0` (Exact pin, enforced determinism)

## 2. Source & Ownership
- **Repository:** https://github.com/prolaxu/swisseph-wasm
- **Maintainer:** prolaxu
- **Copyright:** GNU GENERAL PUBLIC LICENSE, Version 3 — Copyright (C) 2024 prolaxu

## 3. License Type
- **Wrapper Library License:** `GPL-3.0-or-later`
- **Underlying Calculations:** Dual-License (GPL for non-commercial, Commercial License for commercial use)

## 4. License Extract (from tarball `LICENSE`)
> GNU GENERAL PUBLIC LICENSE, Version 3 — Copyright (C) 2024 prolaxu
> 
> ADDITIONAL TERMS FOR SWISS EPHEMERIS:
> Swiss Ephemeris License:
> - Non-commercial use: Free under GNU General Public License
> - Commercial use: Requires a commercial license from Astrodienst AG
>   (Astrodienst AG, Dammstrasse 23, CH-8702 Zollikon, Switzerland,
>    swisseph@astro.com, https://www.astro.com/swisseph/)
> 
> "This wrapper library (swisseph-wasm) is provided under GPL-3.0-or-later,
> but commercial use may require additional licensing for the underlying
> Swiss Ephemeris calculations."

## 5. Compliance Implications for AstroViet
- **AGPL vs GPL-3.0**: The wrapper is strictly `GPL-3.0-or-later`. It does NOT have the Affero (AGPL) network-use clause.
- **Commercial Usage**: If AstroViet operates commercially, it requires a license directly from Astrodienst AG. If non-commercial, it falls safely under the free GNU General Public License.
- **Audit Requirement**: M10 will need to assess the "non-commercial" boundary based on AstroViet's monetization plan. No legal conclusions are assumed at this technical implementation step.
