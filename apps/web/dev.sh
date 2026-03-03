#!/bin/bash
set -uo pipefail

# ============================================================
# Tonkeeper Local Dev — interactive HTTPS proxy manager
# ============================================================
#
# Manages local HTTPS proxies for Tonkeeper Web development.
# Provides an interactive checkbox menu to toggle domains
# that proxy HTTPS traffic to the Vite dev server (localhost:5173).
#
# Available domains:
#   wallet.tonkeeper.local — everyday local development (Safari requires HTTPS)
#   wallet.tonkeeper.com   — OAuth callback testing (overrides the real domain!)
#
# How it works:
#   1. Generates trusted SSL certificates via mkcert
#   2. Writes nginx reverse-proxy configs (listen :443 → localhost:5173)
#   3. Adds /etc/hosts entries so domains resolve to 127.0.0.1
#   4. Reloads nginx
#
# Prerequisites:
#   brew install nginx mkcert
#   mkcert -install
#
# Usage:
#   yarn dev:https    — launch interactive menu (from apps/web/)
#   ./dev.sh          — same, direct invocation
#
# Controls:
#   ↑↓      navigate
#   Space   toggle domain on/off
#   Enter   apply changes
#   q/Esc   quit without changes
#
# Certificates are stored in .ssl/ (git-ignored).
# nginx configs go to /opt/homebrew/etc/nginx/servers/ (Apple Silicon)
# or /usr/local/etc/nginx/servers/ (Intel).
#
# The script only applies the delta between current and desired state,
# so re-running it is always safe. It never stops nginx — only reloads.
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERT_DIR="$SCRIPT_DIR/.ssl"
VITE_PORT=5173

# Detect Homebrew paths (Apple Silicon vs Intel)
if [ -d "/opt/homebrew/etc/nginx" ]; then
    NGINX_CONF_DIR="/opt/homebrew/etc/nginx/servers"
    NGINX_BIN="/opt/homebrew/bin/nginx"
else
    NGINX_CONF_DIR="/usr/local/etc/nginx/servers"
    NGINX_BIN="/usr/local/bin/nginx"
fi

# Domain definitions
DOMAINS=("wallet.tonkeeper.local" "wallet.tonkeeper.com")
LABELS=("Local dev" "OAuth testing")
CONF_NAMES=("tonkeeper-local.conf" "tonkeeper-oauth.conf")

# State arrays (global, used across functions)
declare -a selected
declare -a original

# Track whether cursor is hidden (for cleanup)
CURSOR_HIDDEN=false

# Colors
GREEN='\033[0;32m'
GRAY='\033[0;90m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Cleanup on any exit ───────────────────────────────────────

on_exit() {
    if $CURSOR_HIDDEN; then
        tput cnorm 2>/dev/null
    fi
}
trap on_exit EXIT

# ── Preflight checks ─────────────────────────────────────────

preflight_checks() {
    # Must be running in a terminal (interactive menu needs tty)
    if [ ! -t 0 ]; then
        printf "Error: this script requires an interactive terminal.\n"
        exit 1
    fi

    local ok=true

    if ! command -v "$NGINX_BIN" &>/dev/null; then
        printf "${RED}nginx not found.${RESET} Install: brew install nginx\n"
        ok=false
    fi

    if ! command -v mkcert &>/dev/null; then
        printf "${RED}mkcert not found.${RESET} Install: brew install mkcert && mkcert -install\n"
        ok=false
    fi

    if ! $ok; then
        exit 1
    fi

    # Ensure cert dir exists
    if [ ! -d "$CERT_DIR" ]; then
        mkdir -p "$CERT_DIR"
    fi

    # Ensure nginx servers dir exists
    if [ ! -d "$NGINX_CONF_DIR" ]; then
        sudo mkdir -p "$NGINX_CONF_DIR"
    fi
}

# ── Detect current state ──────────────────────────────────────

detect_state() {
    local i
    for i in "${!DOMAINS[@]}"; do
        if [ -f "$NGINX_CONF_DIR/${CONF_NAMES[$i]}" ]; then
            selected[$i]=true
        else
            selected[$i]=false
        fi
        original[$i]=${selected[$i]}
    done
}

# ── Interactive checkbox menu ─────────────────────────────────

render_menu() {
    local cursor=$1
    local redraw=$2
    local count=${#DOMAINS[@]}

    if [ "$redraw" = true ]; then
        printf "\e[${count}A"
    fi

    local i
    for i in "${!DOMAINS[@]}"; do
        local arrow="  "
        if [ "$i" -eq "$cursor" ]; then
            arrow="${BOLD}›${RESET} "
        fi

        local check="[ ]"
        local color="$RESET"
        if [ "${selected[$i]}" = true ]; then
            check="[x]"
            color="$GREEN"
        fi

        local status=""
        if [ "${original[$i]}" = true ]; then
            status="  ${CYAN}● active${RESET}"
        fi

        printf "${arrow}${color}${check} ${DOMAINS[$i]}${RESET}  ${GRAY}${LABELS[$i]}${RESET}${status}\e[K\n"
    done
}

checkbox_menu() {
    local cursor=0
    local count=${#DOMAINS[@]}
    local user_cancelled=false

    CURSOR_HIDDEN=true
    tput civis

    printf "\n${BOLD}Tonkeeper Local Dev${RESET}\n"
    printf "${GRAY}↑↓ move  Space toggle  Enter apply  q quit${RESET}\n\n"

    render_menu $cursor false

    while true; do
        IFS= read -rsn1 key

        case "$key" in
            $'\x1b')
                # Read rest of escape sequence with timeout
                # If nothing follows within 1s, it's a bare Esc → quit
                # Note: bash 3.2 (macOS default) doesn't support fractional -t
                local rest=""
                read -rsn2 -t 1 rest || true
                case "$rest" in
                    '[A')  # Up
                        if [ $cursor -gt 0 ]; then
                            cursor=$((cursor - 1))
                        fi
                        ;;
                    '[B')  # Down
                        if [ $cursor -lt $((count - 1)) ]; then
                            cursor=$((cursor + 1))
                        fi
                        ;;
                    '')  # Bare Esc — quit without changes
                        user_cancelled=true
                        break
                        ;;
                esac
                ;;
            ' ')
                if [ "${selected[$cursor]}" = true ]; then
                    selected[$cursor]=false
                else
                    selected[$cursor]=true
                fi
                ;;
            'q'|'Q')
                user_cancelled=true
                break
                ;;
            '')  # Enter
                break
                ;;
        esac

        render_menu $cursor true
    done

    CURSOR_HIDDEN=false
    tput cnorm
    echo ""

    if $user_cancelled; then
        # Restore original state
        local i
        for i in "${!DOMAINS[@]}"; do
            selected[$i]=${original[$i]}
        done
        printf "${GRAY}Cancelled. No changes applied.${RESET}\n"
        exit 0
    fi
}

# ── Certificate management ────────────────────────────────────

ensure_cert() {
    local domain="$1"
    local cert_file="$CERT_DIR/${domain}.pem"
    local key_file="$CERT_DIR/${domain}-key.pem"

    if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
        return 0
    fi

    # Check that mkcert CA is installed
    local ca_root
    ca_root=$(mkcert -CAROOT 2>/dev/null)
    if [ ! -d "$ca_root" ] || [ ! -f "$ca_root/rootCA.pem" ]; then
        printf "${YELLOW}  mkcert CA not installed. Running: mkcert -install${RESET}\n"
        if ! mkcert -install; then
            printf "${RED}  Failed to install mkcert CA${RESET}\n"
            return 1
        fi
    fi

    printf "  Generating certificate for ${BOLD}${domain}${RESET}...\n"
    if ! (cd "$CERT_DIR" && mkcert "$domain"); then
        printf "${RED}  Failed to generate certificate for ${domain}${RESET}\n"
        return 1
    fi
}

# ── nginx config generation ───────────────────────────────────

generate_nginx_conf() {
    local domain="$1"
    local cert_file="$CERT_DIR/${domain}.pem"
    local key_file="$CERT_DIR/${domain}-key.pem"

    cat << NGINX_EOF
server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate ${cert_file};
    ssl_certificate_key ${key_file};

    location / {
        proxy_pass http://localhost:${VITE_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400;
    }
}
NGINX_EOF
}

write_nginx_conf() {
    local domain="$1"
    local conf_name="$2"

    generate_nginx_conf "$domain" | sudo tee "$NGINX_CONF_DIR/${conf_name}" > /dev/null
}

# ── DNS management ────────────────────────────────────────────

add_host() {
    local domain="$1"
    local entry="127.0.0.1 ${domain}"

    if ! grep -qxF "$entry" /etc/hosts 2>/dev/null; then
        echo "$entry" | sudo tee -a /etc/hosts > /dev/null
        printf "  Added ${BOLD}${domain}${RESET} to /etc/hosts\n"
    fi
}

remove_host() {
    local domain="$1"

    if grep -qF "$domain" /etc/hosts 2>/dev/null; then
        local tmpfile
        tmpfile=$(mktemp /tmp/hosts.XXXXXX)
        grep -vF "$domain" /etc/hosts > "$tmpfile"
        sudo cp "$tmpfile" /etc/hosts
        rm -f "$tmpfile"
        printf "  Removed ${BOLD}${domain}${RESET} from /etc/hosts\n"
    fi
}

flush_dns() {
    sudo dscacheutil -flushcache 2>/dev/null || true
    sudo killall -HUP mDNSResponder 2>/dev/null || true
}

# ── nginx management ─────────────────────────────────────────

nginx_reload() {
    # Test config first
    if ! sudo "$NGINX_BIN" -t 2>/dev/null; then
        printf "${RED}  nginx config test failed:${RESET}\n"
        sudo "$NGINX_BIN" -t 2>&1 | while IFS= read -r line; do printf "    %s\n" "$line"; done
        return 1
    fi

    if pgrep -x nginx > /dev/null; then
        sudo "$NGINX_BIN" -s reload
    else
        # Only start nginx if we have active configs
        local has_our_configs=false
        local conf
        for conf in "${CONF_NAMES[@]}"; do
            if [ -f "$NGINX_CONF_DIR/$conf" ]; then
                has_our_configs=true
                break
            fi
        done
        if $has_our_configs; then
            sudo "$NGINX_BIN"
        fi
    fi
}

# ── Apply delta ───────────────────────────────────────────────

apply_changes() {
    local changed=false
    local needs_dns_flush=false
    local i

    for i in "${!DOMAINS[@]}"; do
        local domain="${DOMAINS[$i]}"
        local conf="${CONF_NAMES[$i]}"
        local was="${original[$i]}"
        local now="${selected[$i]}"

        if [ "$was" = false ] && [ "$now" = true ]; then
            changed=true
            needs_dns_flush=true
            printf "${GREEN}▸ Enabling ${BOLD}${domain}${RESET}\n"

            if ! ensure_cert "$domain"; then
                printf "${RED}  Skipping ${domain} — certificate error${RESET}\n"
                selected[$i]=false
                continue
            fi
            if ! write_nginx_conf "$domain" "$conf"; then
                printf "${RED}  Skipping ${domain} — failed to write nginx config${RESET}\n"
                selected[$i]=false
                continue
            fi
            add_host "$domain"

            if [ "$domain" = "wallet.tonkeeper.com" ]; then
                printf "  ${YELLOW}⚠ Real wallet.tonkeeper.com is overridden. Disable when done!${RESET}\n"
            fi

        elif [ "$was" = true ] && [ "$now" = false ]; then
            changed=true
            needs_dns_flush=true
            printf "${YELLOW}▸ Disabling ${BOLD}${domain}${RESET}\n"

            if [ -f "$NGINX_CONF_DIR/$conf" ]; then
                sudo rm "$NGINX_CONF_DIR/$conf"
            fi
            remove_host "$domain"
        fi
    done

    if ! $changed; then
        printf "${GRAY}No changes.${RESET}\n"
        return
    fi

    if $needs_dns_flush; then
        flush_dns
    fi

    if ! nginx_reload; then
        printf "${RED}  nginx reload failed — proxies may not be working${RESET}\n"
    fi

    # Summary
    echo ""
    printf "${BOLD}Active proxies:${RESET}\n"
    local any_active=false
    for i in "${!DOMAINS[@]}"; do
        if [ "${selected[$i]}" = true ]; then
            any_active=true
            printf "  ${GREEN}●${RESET} https://${DOMAINS[$i]}\n"
            if [ "${DOMAINS[$i]}" = "wallet.tonkeeper.com" ]; then
                printf "    ${YELLOW}⚠ overrides real domain${RESET}\n"
            fi
        fi
    done
    if ! $any_active; then
        printf "  ${GRAY}none${RESET}\n"
    fi
    echo ""
}

# ── Main ──────────────────────────────────────────────────────

preflight_checks
detect_state
checkbox_menu
apply_changes
