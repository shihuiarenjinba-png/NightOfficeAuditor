# Night Office Auditor — MSIX internal candidate handoff

- Scope: candidate-only, unsigned x64 MSIX / MSIXUPLOAD for local acceptance testing.
- Base source branch: `feature/ui-calculation-consistency-20261019`
- Base source HEAD recorded by audit: `244a6c01d3aa2ec91f692279c55f2357b6224f04`
- Candidate work branch: `ops/msix-candidate-build-20261023`
- Draft PR: https://github.com/shihuiarenjinba-png/NightOfficeAuditor/pull/2
- Store ID (recorded): `9P6SQX67J3R9`
- Identity.Name (recorded): `OkinawaDesktopTools.NightOfficeAuditor`
- Publisher (recorded): `CN=46263F21-A700-41DB-8C9B-114C22FB82FC`
- PublisherDisplayName: `Okinawa Desktop Tools`
- PFN (recorded): `OkinawaDesktopTools.NightOfficeAuditor_j8yefg9jgfh58`
- Package SID (historical record only): `S-1-15-2-2412059185-2823278480-640090009-3386863683-3978494385-661850780-1691246839`
- Candidate-only package version currently used by workflow: `1.0.0.0` (NOT an approved Store release version).

## Boundaries

This is an internal build candidate, not a Store-certified or signed release. Current Partner Center identity/name, brand assets, approved Store version, listing language and content-rating declarations are not live-confirmed by this workflow. Do not upload, submit for certification, publish, change price/regions, or change the listing. Keep all recorded Identity fields sourced from `store/partner-center-identity.json`; do not infer or alter the SID. The local code owner must install and launch the package, test persistence/save/restore, update/uninstall, capture screenshots/logs, and run applicable WACK/Store validation before any release decision.

## Candidate artifact acceptance

A candidate is considered built only when Actions reports success, both `.msix` and `.msixupload` are present in the artifact, internal `AppxManifest.xml` checks pass for Name/Publisher/PublisherDisplayName/both DisplayName locations/Version/x64, and SHA-256 values are recorded in the output ledger. Test success alone is not package success. If a run fails before runner allocation (`runner_id=0`, empty steps), record it as infrastructure/runner failure and retry without relabelling it as a code failure.

## Latest source adjustments

The candidate packaging is isolated from the original browser-game scripts. It uses a sandboxed Electron wrapper, a canonical identity gate, review-only icon candidates that do not overwrite existing images, a version guard with revision zero, an internal Manifest verifier, and an explicit candidate-only approval mode. No Partner Center operation is performed by the workflow.
