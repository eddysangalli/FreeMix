# Independent Direct Out review

Approved the final frontend draft ff4a77c8 only. Nine checks run full-source functions in a limited VM/DOM, including held dispatch, queued discard, held post-ACK read, newer edit, recreated UUID, scope, unknown device stop, refusal and observed disconnect. Canonical remains d5173ff3. No Native, API server, browser or audio device was used.

Two independently reproduced defects are preserved: in-flight buttons remained enabled in 7884; the 9376 correction contained actual UTF-8 mojibake. The final derivative fixes both. It preserves pending checkbox false, device, level and delay. Stop intentionally keeps prior backend device/level/delay.

Gemini was attempted first with selected public inline source and no-tools brief. Exit 0/SUCCESS contained an empty response plus a 120-second print timeout; this is operational failure, not established quota exhaustion or approval. The fallback source/VM review followed that failure. Raw CLI output is excluded from this allowlist; hashes and disposition are included.

Observed connection is failed audio GET/presented DOM, without Native generation. Invisible same-scope reconnect, generic command uncertainty, HTTP integration, visual layout and physical output remain outside approval. No mutation resend was introduced. Root owns integration and any later runtime check.
