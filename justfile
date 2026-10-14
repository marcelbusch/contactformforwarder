import "~/justfile"

image := "git.bl0cka.de/marcel/contactformforwarder"
platform := "linux/amd64"

# Build the image locally, tagged :latest and :<VERSION>
build:
    docker buildx build --platform {{platform}} -t {{image}}:latest -t {{image}}:{{version}} --load .

# Build the image and push :latest and :<VERSION> to the registry
push:
    docker buildx build --platform {{platform}} -t {{image}}:latest -t {{image}}:{{version}} --push .

# Bump VERSION (commit + tag), then optionally build and push the image
release:
    #!/usr/bin/env bash
    set -euo pipefail
    just bump
    # fresh `just` invocation so `version` picks up the bumped VERSION file
    if just confirm "Build and push {{image}}:$(tr -d '[:space:]' < VERSION)?"; then
      echo
      just push
    fi
