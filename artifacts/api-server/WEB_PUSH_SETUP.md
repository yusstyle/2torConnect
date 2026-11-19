# Background notification setup

The API needs these production environment variables before users can subscribe to Chrome notifications:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY` — keep this secret; do not commit it to Git.
- `VAPID_SUBJECT` — a contact URI such as `mailto:support@2torconnect.com`.

Generate a matching key pair with:

```sh
pnpm --dir artifacts/api-server exec web-push generate-vapid-keys
```

Add the generated public and private keys, plus `VAPID_SUBJECT`, to the Vercel project's Production environment variables, then redeploy. The public key is returned by `/api/notifications/push-config`; the private key is used only by the API.
