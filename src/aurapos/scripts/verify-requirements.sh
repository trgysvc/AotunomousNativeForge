#!/usr/bin/env bash
set -euo pipefail

check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        echo "Error: $1 is not installed."
        case "$1" in
            node) echo "Please install Node.js (latest stable) from https://nodejs.org/";;
            pnpm) echo "Please install pnpm via npm: npm install -g pnpm";;
            docker) echo "Please install Docker Engine from https://docs.docker.com/get-docker/";;
            git) echo "Please install Git from https://git-scm.com/downloads";;
        esac
        exit 1
    fi
}

check_cmd node
check_cmd pnpm
check_cmd docker
check_cmd git

echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo "Docker version: $(docker --version)"
echo "Git version: $(git --version)"