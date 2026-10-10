# Setup060000 prepared; not executed

Adaptation of immutable050500 runner, preserving its FAIL receipt and all Root IAB500 proof bytes. Version0.1.0-local.20261010060000; same Native24 a04786090fcbe7ede495f18e5ad38ccaa9793478/freeze cacd7dc42290a9b396b5847ed8cb2f5e27a911adbc31c64fdacdeb44dd0fd087. Wait for Root final candidate, source commit, manifest, ZIP and Setup pins and explicit permission.

Eleven CLI arguments stay mandatory: candidate/candidate-sha/setup-exe/setup-sha/zip/zip-sha/manifest-sha/receipt/native-head/native-freeze/native-freeze-sha. Receipt is new setup-060000-qa/receipt.json. Every signed manifest entry uses candidate.files count; no hardcoded9582.

Process observation uses the sealed source helper even after uninstall. Only helper(path=null,exited=false) causes bounded read-only CIM query of the known own PID, selecting ProcessId/ExecutablePath/CreationDate only. Successful CIM absence confirms exit; uncertain or mismatched path cannot authorize kill. Each helper/CIM probe timeout5s; identity wall budget10s and Native/API exit budget20s, with at most one in-flight probe adding up to10s. A probe timeout fails safely.

Closure checkpoints record Native cycle0, cycle1 and API stop before later checks. Finally records cleanup/preservation errors and still writes a FAIL receipt. No original unknown caught cause from050500 is invented.

Root browser review uses own installed URLs and120s hold. Future Root proof has files[{file,bytes,sha256}], validated against actual JPEG files without rewriting proof bytes. IAB/backend evidence is distinct from CEF editor/hardware/performance acceptance. No unchanged HDR/decode/QR/ticker media matrices. No product/Native/build/Git/selection mutation by preparation.
