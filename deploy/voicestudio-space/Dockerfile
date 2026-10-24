# VoiceStudio backend for a Hugging Face Docker Space (see docs/voicestudio.md).
FROM ghcr.io/debpalash/voicestudio:stable

# Spaces run the container as UID 1000, so the data dir must be writable by that user.
RUN mkdir -p /app/omnivoice_data/home && chmod -R 777 /app/omnivoice_data

ENV OMNIVOICE_DATA_DIR=/app/omnivoice_data \
    HF_HOME=/app/omnivoice_data/huggingface \
    HOME=/app/omnivoice_data/home \
    OMNIVOICE_ANALYTICS_DISABLED=1

# OMNIVOICE_API_KEY comes from the Space's secrets.
EXPOSE 3900
