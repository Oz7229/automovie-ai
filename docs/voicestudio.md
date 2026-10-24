# VoiceStudio voice backend

CreateFlow AI can generate voiceovers with [VoiceStudio](https://github.com/debpalash/VoiceStudio),
an open-source voice-cloning TTS server. The site never runs the models itself:
it calls a VoiceStudio server you host, through its OpenAI-compatible API.

```
Browser ──▶ /api/voice (site server) ──▶ VOICESTUDIO_URL/v1/audio/speech (your GPU server)
```

The API key stays on the site's server. Browsers never see it.

## 1. Rent a server

Use a Linux **x86-64** machine with an **NVIDIA GPU**. Examples are RunPod, Lambda,
Vast.ai, Hetzner GPU, or a GPU VM on AWS, GCP or Azure.

- **GPU memory:** 8 GB VRAM or more is comfortable. CPU-only works, but it is
  slow (minutes per scene).
- **Disk:** 30 GB or more for the image and model weights.
- **Software:** Docker plus the NVIDIA Container Toolkit. Most GPU providers
  preinstall both.

## 2. Start VoiceStudio

On the server, generate an API key and keep it somewhere safe:

```bash
export OMNIVOICE_API_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
echo "$OMNIVOICE_API_KEY"
```

Run the stable image. It is bound to loopback here, and step 3 puts HTTPS in front of it.

```bash
docker run -d --name voicestudio --restart unless-stopped --gpus all \
  -p 127.0.0.1:3900:3900 \
  -e OMNIVOICE_API_KEY="$OMNIVOICE_API_KEY" \
  -e OMNIVOICE_ANALYTICS_DISABLED=1 \
  -v voicestudio-data:/app/omnivoice_data \
  ghcr.io/debpalash/voicestudio:stable
```

Drop `--gpus all` on a CPU-only host. Check that it is up:

```bash
curl -s http://127.0.0.1:3900/health
# {"status":"ok","device":"cuda","version":"0.5.6"}
```

## 3. Put HTTPS in front of it

VoiceStudio's docs warn against exposing the plain-HTTP port to the internet.
[Caddy](https://caddyserver.com) issues a certificate automatically. Point a
DNS record such as `voice.example.com` at the server, then run:

```bash
docker run -d --name caddy --restart unless-stopped --network host \
  -v caddy-data:/data \
  caddy:2 caddy reverse-proxy --from voice.example.com --to 127.0.0.1:3900
```

If your GPU provider gives you an HTTPS proxy URL instead (for example RunPod's
`https://<pod-id>-3900.proxy.runpod.net`), you can use that and skip Caddy.
In that case, publish the port as `-p 3900:3900`.

## 4. Install a voice model and clone voices

Open `https://voice.example.com` in a browser and sign in with the API key.
From there:

1. **Settings → Models:** install a TTS engine, for example OmniVoice. The app
   shows each model's size and license before downloading. Accept the license
   there.
2. **Voices:** clone a voice from a short reference clip. Every voice profile
   you create appears in the site's VoiceStudio voice list.

## 5. Connect the site

Set two server-side secrets. In Lovable, use **Project settings → Secrets**.
For local dev, use `.env`.

```
VOICESTUDIO_URL=https://voice.example.com
VOICESTUDIO_API_KEY=<the OMNIVOICE_API_KEY from step 2>
```

On the **Voiceovers** page, choose **VoiceStudio (self-hosted voice cloning)**.
Then pick **Default engine voice** or one of your cloned voices, and generate.

## Notes

- **Cold starts:** the first request after the server starts loads the model,
  which can take a few minutes. The site waits up to 5 minutes per request.
- **Updating:** run `docker pull ghcr.io/debpalash/voicestudio:stable`, then
  `docker rm -f voicestudio`, then rerun the `docker run` command. Voices and
  models persist in the `voicestudio-data` volume.
- **Errors:** VoiceStudio errors such as "model not installed" or "license not
  accepted" are shown in the status bar on the Voiceovers page.
