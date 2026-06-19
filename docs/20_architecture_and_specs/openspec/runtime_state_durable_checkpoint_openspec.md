# Runtime State Durable Checkpoint OpenSpec

Status: non-Debug continuation/recovery foundation.

The runtime-state checkpoint records stage, cursor, last successful stage, queue position, and DB integrity summary as counts/metadata only. It may help future workers continue after a clean boot, but recovery behavior is disabled until real reboot/power-loss proof exists.
