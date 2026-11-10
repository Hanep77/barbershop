# JWT keys

- `test/` is generated on demand by the automated tests (`tests/TestCase.php`)
  or by `infrastructure/scripts/generate-test-keys.*`. It is gitignored and
  contains a throwaway RSA key pair. Never use it outside tests.
- `infrastructure/secrets/jwt-private.pem` and `jwt-public.pem` are generated
  by `infrastructure/scripts/generate-dev-secrets.*` for local use. The private
  key is mounted only into identity service containers; every service gets the
  public key.

Regenerate a production pair:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out infrastructure/secrets/jwt-private.pem
openssl rsa -in infrastructure/secrets/jwt-private.pem -pubout -out infrastructure/secrets/jwt-public.pem
chmod 600 infrastructure/secrets/jwt-private.pem
```
