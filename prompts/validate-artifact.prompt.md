# validate-artifact

Use `scripts/validate_artifact.py` to validate a public-safe synthetic Lumen Light artifact.

## Inputs

- Path to one JSON artifact fixture.

## Preconditions

- The fixture must be synthetic.
- The fixture must not contain private transcripts, local paths, account IDs, or credentials.

## Verification

Run:

```bash
python3 scripts/validate_artifact.py examples/conversation-artifact.example.json
```

Expected output:

```text
LUMEN_LIGHT_ARTIFACT_OK
```

## Do not

- Validate private operational logs in this public repo.
- Add real user data to examples.
- Treat schema validation as a privacy audit.
