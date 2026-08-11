# AI safety

Tomir AI is decision support, not an autonomous physician. Every result states that human review is required; only clinicians make final decisions.

The system preserves units, distinguishes observations from interpretations, calls out missing evidence, rejects malformed structured output, and never invents lab or image findings. Timeouts, bounded retries, idempotent request IDs, provider/model version storage, and a visibly labelled unavailable/demo fallback are required for real-provider adapters.

The demo provider is deterministic and explicitly labelled DEMO/SYNTHETIC. A real-provider failure must never be silently converted into a successful-looking result.
