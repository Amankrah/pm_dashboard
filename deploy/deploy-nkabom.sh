#!/bin/bash
# =============================================================================
# Nkabom Activity Map — Secure Production Deployment Script
# Domain: configure DOMAIN below (or pass via env). Default nkabom.sasellab.com
# =============================================================================
#
# Deploys the Nkabom faculty activity dashboard on a fresh Ubuntu 24.04 EC2
# instance:
#   - Next.js 16 + React 19 app (single Node service)
#   - SQLite database on a dedicated data dir at /var/lib/nkabom
#   - Nginx reverse proxy + Let's Encrypt SSL
#   - UFW + fail2ban + automatic security updates
#   - Supervisor managing `next start`
#   - Nightly SQLite backup + watchdog
#
# Usage:
#   ALLOWED_SSH_IP=70.82.222.52 \
#   DOMAIN=nkabom.sasellab.com \
#   ALLOWED_EMAILS="ebenezer.kwofie@mcgill.ca,collaborator@mcgill.ca" \
#     ./deploy/deploy-nkabom.sh
#
# Flags:
#   --skip-security   Skip Phase 1 (firewall / fail2ban / SSH hardening)
#   --skip-ssl        Skip Phase 5.2 (certbot)
#   --skip-seed       Skip Phase 3.6 (Prisma seed of admin row + reporting period)
#
# Prereqs on the EC2 instance:
#   - Ubuntu 24.04 LTS, ubuntu user with sudo
#   - Security group: 22 (from your IP), 80, 443
#   - DNS A record for DOMAIN -> instance Elastic IP (only needed for SSL)
#
# What you MUST supply via env vars (or accept the defaults shown):
#   - ALLOWED_SSH_IP (no default; the script refuses to lock the SG to a
#     placeholder)
#   - ALLOWED_EMAILS (comma-separated McGill emails permitted to sign in;
#     no default)
#
# What the script will auto-generate if you don't supply them:
#   - SESSION_SECRET (64-hex-char random)
#   - APP_PASSWORD   (24-char random; printed once at the end)
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION - edit these or override via environment variables
# =============================================================================

ALLOWED_SSH_IP="${ALLOWED_SSH_IP:-YOUR_IP_HERE}"

DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
PROJECT_DIR="${PROJECT_DIR:-/var/www/nkabom}"
WEB_DIR="$PROJECT_DIR/web"          # the Next.js app lives in repo/web/
DATA_DIR="${DATA_DIR:-/var/lib/nkabom}"
DB_FILE="$DATA_DIR/prod.db"
LOG_DIR="${LOG_DIR:-/var/log/nkabom}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/nkabom}"

DOMAIN="${DOMAIN:-nkabom.sasellab.com}"
SSL_EMAIL="${SSL_EMAIL:-ebenezer.kwofie@mcgill.ca}"

GIT_REPO="${GIT_REPO:-https://github.com/Amankrah/pm_dashboard.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"

NODE_MAJOR="${NODE_MAJOR:-22}"      # Next 16 / React 19 want Node >= 20; default 22 LTS

# Allowlist + admin. The seed file upserts these on every run.
ALLOWED_EMAILS="${ALLOWED_EMAILS:-}"
SEED_ADMIN_EMAIL="${SEED_ADMIN_EMAIL:-}"

# Secrets. Auto-generated below if empty.
SESSION_SECRET="${SESSION_SECRET:-}"
APP_PASSWORD="${APP_PASSWORD:-}"

# NOTE: this deployment does not use server-side SMTP. All outbound mail is
# composed in the operator's McGill Outlook via mailto links. No SMTP_* /
# NOTIFY_* variables are written to .env.

# Memory watchdog threshold (MB). Next.js + SQLite is tiny; on a 2GB box
# anything below ~200MB available is worth a restart.
MEMORY_THRESHOLD_MB="${MEMORY_THRESHOLD_MB:-200}"

# =============================================================================
# COLORS AND HELPERS
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
    echo -e "${CYAN}"
    echo "+------------------------------------------------------------------+"
    echo "|        Nkabom Activity Map - Production Deployment               |"
    echo "|        Mastercard Foundation . McGill University                 |"
    echo "+------------------------------------------------------------------+"
    echo -e "${NC}"
}

print_status()  { echo -e "${GREEN}[ok]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC}  $1"; }
print_error()   { echo -e "${RED}[x]${NC}  $1"; }
print_step()    { echo -e "\n${BLUE}[step]${NC} $1\n"; }
print_section() {
    echo -e "\n${CYAN}====================================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}====================================================================${NC}\n"
}

# Idempotent cron-line installer that tolerates a missing crontab.
#
# On a fresh user (or freshly-baked AMI) `crontab -l` exits 1 because there is
# no crontab at all, and with `set -euo pipefail` that kills the script. We
# swallow that exit code and re-write the crontab so the line is present
# exactly once regardless of prior state.
#
# Usage:
#   install_cron        "grep-key"  "cron-line"   # current user
#   install_cron --sudo "grep-key"  "cron-line"   # root crontab
install_cron() {
    local cron_cmd="crontab"
    if [ "${1:-}" = "--sudo" ]; then
        cron_cmd="sudo crontab"
        shift
    fi
    local key="$1"
    local line="$2"
    {
        $cron_cmd -l 2>/dev/null | grep -v -F "$key" || true
        echo "$line"
    } | $cron_cmd -
}

SKIP_SECURITY=false
SKIP_SSL=false
SKIP_SEED=false
for arg in "$@"; do
    case $arg in
        --skip-security) SKIP_SECURITY=true ;;
        --skip-ssl)      SKIP_SSL=true ;;
        --skip-seed)     SKIP_SEED=true ;;
    esac
done

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================

print_banner

if [[ $EUID -eq 0 ]]; then
    print_error "Do not run as root. Run as the deploy user (e.g. ubuntu) with sudo access."
    exit 1
fi

if [[ "$ALLOWED_SSH_IP" == "YOUR_IP_HERE" ]]; then
    print_error "ALLOWED_SSH_IP is not set."
    print_warning "Find your IP: curl -s ifconfig.me"
    print_warning "Then run: ALLOWED_SSH_IP=your.ip.here ALLOWED_EMAILS=\"you@mcgill.ca\" ./deploy/deploy-nkabom.sh"
    exit 1
fi

if [[ -z "$ALLOWED_EMAILS" ]]; then
    print_error "ALLOWED_EMAILS is not set. Without it, nobody can sign in."
    print_warning 'Example: ALLOWED_EMAILS="ebenezer.kwofie@mcgill.ca,colleague@mcgill.ca"'
    exit 1
fi

# Default the admin to the first allowlisted email if not given explicitly.
if [[ -z "$SEED_ADMIN_EMAIL" ]]; then
    SEED_ADMIN_EMAIL="$(echo "$ALLOWED_EMAILS" | cut -d',' -f1 | xargs)"
    print_warning "SEED_ADMIN_EMAIL defaulted to: $SEED_ADMIN_EMAIL"
fi

# Auto-generate secrets if empty.
if [[ -z "$SESSION_SECRET" ]]; then
    SESSION_SECRET=$(openssl rand -hex 32)
    print_warning "SESSION_SECRET auto-generated (64 hex chars)"
fi
if [[ -z "$APP_PASSWORD" ]]; then
    APP_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | head -c 24)
    print_warning "APP_PASSWORD auto-generated; will be printed at the end"
    GENERATED_PASSWORD=true
fi

if [[ "$DOMAIN" == "nkabom.sasellab.com" && "$SKIP_SSL" == false ]]; then
    print_warning "Using default DOMAIN=$DOMAIN. Make sure DNS A record points to this box."
fi

print_status "SSH access will be restricted to: $ALLOWED_SSH_IP"
print_status "Target domain: $DOMAIN"
print_status "Allowed sign-in emails: $ALLOWED_EMAILS"
print_status "Initial admin: $SEED_ADMIN_EMAIL"
print_warning "Make sure $ALLOWED_SSH_IP is YOUR IP or you will be locked out!"
echo ""
read -rp "Press Enter to continue or Ctrl+C to abort..."

# =============================================================================
# PHASE 1: SECURITY HARDENING
# =============================================================================

if [[ "$SKIP_SECURITY" == false ]]; then
    print_section "PHASE 1: SECURITY HARDENING"

    print_step "1.1 System updates"
    sudo apt update
    sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y
    print_status "System updated"

    print_step "1.2 Installing security tools"
    sudo apt install -y \
        fail2ban \
        ufw \
        unattended-upgrades \
        apt-listchanges \
        logwatch
    print_status "Security tools installed"

    print_step "1.3 Configuring firewall (UFW)"
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow from "$ALLOWED_SSH_IP" to any port 22 proto tcp comment 'SSH from allowed IP'
    sudo ufw allow 80/tcp  comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    sudo ufw --force enable
    sudo ufw status verbose
    print_status "Firewall configured"

    print_step "1.4 Configuring fail2ban"
    sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 86400
findtime = 600
maxretry = 5
backend = systemd
banaction = ufw

[sshd]
enabled = true
port = ssh
filter = sshd
maxretry = 3
bantime = 86400
findtime = 600
EOF
    sudo systemctl enable fail2ban
    sudo systemctl restart fail2ban
    print_status "fail2ban configured"

    print_step "1.5 Configuring automatic security updates"
    sudo tee /etc/apt/apt.conf.d/20auto-upgrades > /dev/null << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
EOF
    sudo tee /etc/apt/apt.conf.d/50unattended-upgrades > /dev/null << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    sudo systemctl enable unattended-upgrades
    sudo systemctl start unattended-upgrades
    print_status "Auto-updates configured"

    print_step "1.6 SSH hardening"
    sudo tee /etc/ssh/sshd_config.d/hardening.conf > /dev/null << 'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
EOF
    if sudo sshd -t; then
        sudo systemctl restart sshd || sudo systemctl restart ssh
        print_status "SSH hardened"
    else
        print_error "SSH config invalid - leaving previous config in place"
    fi

    print_step "1.7 Installing security check script"
    sudo tee /usr/local/bin/security-check.sh > /dev/null << 'EOFSCRIPT'
#!/bin/bash
echo "=== Security Check $(date) ==="
echo -e "\n--- Crontabs ---"
for user in $(cut -f1 -d: /etc/passwd); do
    crontab -u $user -l 2>/dev/null | grep -v "^#" | grep -v "^$" && echo "  ^ User: $user"
done
echo -e "\n--- Suspicious processes ---"
ps aux | grep -E "(xmrig|kdevtmpfsi|pnscan|/dev/shm/|/var/tmp/\.)" | grep -v grep || echo "None found"
echo -e "\n--- High CPU processes ---"
ps aux --sort=-%cpu | head -5
echo -e "\n--- Failed SSH attempts (last 24h) ---"
sudo grep "Failed password\|Invalid user" /var/log/auth.log 2>/dev/null | tail -10 || echo "None"
echo -e "\n--- fail2ban status ---"
sudo fail2ban-client status sshd 2>/dev/null || echo "fail2ban not running"
echo -e "\n--- Listening ports ---"
sudo ss -tlnp
echo -e "\n=== Check Complete ==="
EOFSCRIPT
    sudo chmod +x /usr/local/bin/security-check.sh
    install_cron "security-check.sh" \
        "0 8 * * 1 /usr/local/bin/security-check.sh >> /var/log/security-check.log 2>&1"
    print_status "Security monitoring scheduled (Mondays 08:00)"

    print_status "Phase 1 complete"
else
    print_warning "Skipping security hardening (--skip-security)"
fi

# =============================================================================
# PHASE 2: SYSTEM DEPENDENCIES
# =============================================================================

print_section "PHASE 2: SYSTEM DEPENDENCIES"

print_step "2.1 Build dependencies"
sudo apt install -y \
    nginx supervisor certbot python3-certbot-nginx \
    curl wget git build-essential \
    sqlite3 \
    jq htop unzip
print_status "Apt packages installed"

print_step "2.2 Node.js ${NODE_MAJOR}.x"
if ! command -v node &> /dev/null || ! node --version | grep -q "v${NODE_MAJOR}"; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
    sudo apt install -y nodejs
fi
print_status "Node.js $(node --version), npm $(npm --version)"

print_step "2.3 Swap (helps small instances during npm build)"
# Next 16 + React Compiler + Tailwind 4 build is memory-hungry. On a t4g.small
# (2GB RAM) the build can OOM. Add a 2GB swap file if RAM <= 4GB and no swap
# exists. This is a one-time setup; reruns are no-ops.
TOTAL_MEM_MB=$(free -m | awk '/^Mem:/ {print $2}')
CURRENT_SWAP_MB=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$TOTAL_MEM_MB" -le 4096 ] && [ "$CURRENT_SWAP_MB" -lt 1024 ]; then
    print_warning "Total RAM ${TOTAL_MEM_MB}MB, swap ${CURRENT_SWAP_MB}MB. Adding 2GB swapfile."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    if ! grep -q "^/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    print_status "Swap enabled: $(free -m | awk '/^Swap:/ {print $2}')MB"
else
    print_status "RAM/swap sufficient (RAM ${TOTAL_MEM_MB}MB, swap ${CURRENT_SWAP_MB}MB)"
fi

# =============================================================================
# PHASE 3: APPLICATION DEPLOYMENT
# =============================================================================

print_section "PHASE 3: APPLICATION DEPLOYMENT"

print_step "3.1 Cloning repository"
if [ -d "$PROJECT_DIR/.git" ]; then
    print_warning "Project exists - pulling latest"
    cd "$PROJECT_DIR"
    git fetch --all
    git checkout "$GIT_BRANCH"
    git pull origin "$GIT_BRANCH"
else
    sudo mkdir -p "$(dirname "$PROJECT_DIR")"
    sudo chown "$USER:$USER" "$(dirname "$PROJECT_DIR")"
    git clone -b "$GIT_BRANCH" "$GIT_REPO" "$PROJECT_DIR"
fi
sudo chown -R "$USER:$USER" "$PROJECT_DIR"
print_status "Repo at $PROJECT_DIR"

if [ ! -d "$WEB_DIR" ]; then
    print_error "Expected $WEB_DIR to exist (the Next.js app). Repo layout changed?"
    exit 1
fi

print_step "3.2 Provisioning data and log directories"
sudo mkdir -p "$DATA_DIR" "$LOG_DIR" "$BACKUP_DIR"
sudo chown -R "$USER:$USER" "$DATA_DIR" "$LOG_DIR" "$BACKUP_DIR"
print_status "Data: $DATA_DIR  |  Logs: $LOG_DIR  |  Backups: $BACKUP_DIR"

# Track whether this is the first deploy (no DB yet). Used later to decide
# whether to print the auto-generated password.
FRESH_DB=false
if [ ! -f "$DB_FILE" ]; then
    FRESH_DB=true
fi

print_step "3.3 Writing $WEB_DIR/.env"
# Note: DATABASE_URL uses an absolute path under DATA_DIR so backups + EBS
# snapshots are clean, and a `git pull` cannot stomp the production DB.
cat > "$WEB_DIR/.env" << EOF
# Nkabom backend environment - production. Generated by deploy-nkabom.sh.

# SQLite database (absolute path under $DATA_DIR)
DATABASE_URL="file:$DB_FILE"

# Sign-in allowlist (comma-separated)
ALLOWED_EMAILS="$ALLOWED_EMAILS"

# First admin user (must also appear in ALLOWED_EMAILS)
SEED_ADMIN_EMAIL="$SEED_ADMIN_EMAIL"

# Shared password for dashboard login
APP_PASSWORD="$APP_PASSWORD"

# JWT signing secret
SESSION_SECRET="$SESSION_SECRET"

# Public URL for invite links
NEXT_PUBLIC_APP_URL="https://$DOMAIN"

# Outbound mail: this deployment does not use SMTP. The dashboard generates
# mailto links that open in the operator's McGill Outlook.

NODE_ENV=production
EOF
chmod 600 "$WEB_DIR/.env"
print_status "Wrote $WEB_DIR/.env (mode 600)"

print_step "3.4 Installing npm dependencies"
cd "$WEB_DIR"
# `npm ci` requires package-lock.json to match exactly. Fall back to install if
# the lock is missing for some reason (it shouldn't be).
if [ -f package-lock.json ]; then
    NODE_OPTIONS="--max-old-space-size=2048" npm ci
else
    NODE_OPTIONS="--max-old-space-size=2048" npm install
fi
print_status "npm dependencies installed"

print_step "3.5 Running Prisma migrations"
cd "$WEB_DIR"
# Prisma loads .env via prisma.config.ts (which does dotenv/config), so running
# from WEB_DIR picks up the DATABASE_URL we just wrote.
npx prisma migrate deploy
print_status "Migrations applied to $DB_FILE"

if [[ "$SKIP_SEED" == false ]]; then
    print_step "3.6 Seeding admin row and reporting period"
    # The seed is idempotent: it upserts the allowlist users and the default
    # reporting period on every run. Sample submissions are opt-in (gated by
    # SEED_SAMPLES=true) and we DO NOT set that here, so production starts
    # with a clean database. Safe to call on every deploy.
    npx prisma db seed
    print_status "Seed complete (no sample submissions inserted)"
else
    print_warning "Skipping seed (--skip-seed). Make sure AllowedUser has at least one row."
fi

print_step "3.7 Building Next.js for production"
cd "$WEB_DIR"
# Clear stale Turbopack output if any
rm -rf .next 2>/dev/null || true
NODE_OPTIONS="--max-old-space-size=2048" npm run build
print_status "Build artefacts in $WEB_DIR/.next"

# =============================================================================
# PHASE 4: SERVER CONFIGURATION
# =============================================================================

print_section "PHASE 4: SERVER CONFIGURATION"

print_step "4.1 Nginx config"
sudo tee /etc/nginx/sites-available/nkabom > /dev/null << EOF
# Rate-limit zones - the public form is the only unauthenticated write path;
# everything else sits behind cookie auth.
limit_req_zone \$binary_remote_addr zone=public_api:10m rate=5r/s;
limit_req_zone \$binary_remote_addr zone=general:10m   rate=20r/s;
limit_conn_zone \$binary_remote_addr zone=conn_limit:10m;

upstream nkabom_app {
    server 127.0.0.1:3000 fail_timeout=30s;
    keepalive 32;
}

# Block direct IP access - return 444 (Nginx-specific: close without response)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 444;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Baseline security headers (certbot will add HSTS after issuing the cert)
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 4M;

    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_redirect off;
    proxy_read_timeout 120;
    proxy_connect_timeout 30;
    proxy_send_timeout 60;

    # Public submission endpoint - tighter rate limit
    location /api/public/ {
        limit_req zone=public_api burst=10 nodelay;
        limit_conn conn_limit 5;
        proxy_pass http://nkabom_app;
    }

    # Other API routes (dashboard / admin) - moderate limit, cookie-gated
    location /api/ {
        limit_req zone=general burst=30 nodelay;
        proxy_pass http://nkabom_app;
    }

    # Next.js static assets - long cache
    location /_next/static/ {
        proxy_pass http://nkabom_app;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Brand and other static files served from /public
    location /brand/ {
        proxy_pass http://nkabom_app;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Everything else (pages + public form + dashboard SSR)
    location / {
        limit_req zone=general burst=40 nodelay;
        proxy_pass http://nkabom_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }

    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/html;
        internal;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/nkabom /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
print_status "Nginx configured"

sudo mkdir -p /var/www/html
sudo tee /var/www/html/50x.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html><head><title>Nkabom - temporarily unavailable</title>
<style>body{font-family:-apple-system,sans-serif;text-align:center;margin-top:100px;background:linear-gradient(135deg,#152c47,#1e3a5f);color:white;padding:20px}
.box{background:rgba(255,255,255,.08);border-radius:20px;padding:40px;max-width:560px;margin:0 auto}</style></head>
<body><div class="box"><h1>Nkabom Activity Map</h1><h2>Service temporarily unavailable</h2>
<p>The dashboard is restarting. Please try again in a moment.</p></div></body></html>
EOF

print_step "4.2 Supervisor - single Next.js service"

NPM_PATH=$(command -v npm)

sudo tee /etc/supervisor/conf.d/nkabom-web.conf > /dev/null << EOF
[program:nkabom-web]
command=$NPM_PATH run start
directory=$WEB_DIR
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/web.log
stderr_logfile=$LOG_DIR/web-error.log
environment=NODE_ENV="production",PORT="3000",NODE_OPTIONS="--max-old-space-size=1024",HOSTNAME="127.0.0.1"
stopwaitsecs=30
stopsignal=TERM
stopasgroup=true
killasgroup=true
EOF

sudo touch "$LOG_DIR"/web.log "$LOG_DIR"/web-error.log
sudo chown "$USER:$USER" "$LOG_DIR"/*.log
print_status "Supervisor program registered"

print_step "4.3 Log rotation"
sudo tee /etc/logrotate.d/nkabom > /dev/null << EOF
$LOG_DIR/*.log {
    daily
    rotate 14
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
    su $USER $USER
}
EOF
print_status "Logrotate configured (14-day retention)"

print_step "4.4 Memory watchdog"
# Restart the Next.js process if available memory dips below threshold.
# Next.js is normally lean (~200-400MB) but a runaway leak shouldn't OOM
# the box; this kicks it before the kernel OOM killer does.
sudo tee /usr/local/bin/nkabom-memory-watchdog.sh > /dev/null << EOFWD
#!/bin/bash
# Memory watchdog - restart nkabom-web if MemAvailable falls below threshold.
# Runs from cron every 5 minutes.

THRESHOLD_MB=$MEMORY_THRESHOLD_MB
LOG=$LOG_DIR/memory-watchdog.log

mkdir -p $LOG_DIR

available_kb=\$(grep MemAvailable /proc/meminfo | awk '{print \$2}')
available_mb=\$((available_kb / 1024))
total_kb=\$(grep MemTotal /proc/meminfo | awk '{print \$2}')
total_mb=\$((total_kb / 1024))
used_mb=\$((total_mb - available_mb))
pct=\$((used_mb * 100 / total_mb))

if [ "\$available_mb" -lt "\$THRESHOLD_MB" ]; then
    echo "\$(date '+%Y-%m-%d %H:%M:%S') WARN available=\${available_mb}MB (<\${THRESHOLD_MB}MB) - restarting nkabom-web" >> "\$LOG"
    sudo supervisorctl restart nkabom-web
    echo "\$(date '+%Y-%m-%d %H:%M:%S') INFO nkabom-web restarted" >> "\$LOG"
else
    # Hourly baseline (only in the first 5 minutes of each hour)
    minute=\$(date +%M)
    if [ "\$((10#\$minute))" -lt 5 ]; then
        echo "\$(date '+%Y-%m-%d %H:%M:%S') OK available=\${available_mb}MB used=\${used_mb}MB (\${pct}%)" >> "\$LOG"
    fi
fi
EOFWD
sudo chmod +x /usr/local/bin/nkabom-memory-watchdog.sh
install_cron --sudo "nkabom-memory-watchdog" \
    "*/5 * * * * /usr/local/bin/nkabom-memory-watchdog.sh"
print_status "Memory watchdog scheduled (threshold ${MEMORY_THRESHOLD_MB}MB, every 5 min)"

# =============================================================================
# PHASE 5: SSL AND STARTUP
# =============================================================================

print_section "PHASE 5: SSL AND STARTUP"

print_step "5.1 Starting services"
sudo systemctl enable nginx supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo systemctl start nginx
sudo supervisorctl start all
print_status "Waiting 10s for Next.js to settle..."
sleep 10
sudo supervisorctl status

print_step "5.2 SSL certificate"
if [[ "$SKIP_SSL" == false ]]; then
    sudo mkdir -p /etc/letsencrypt
    if [ ! -f "/etc/letsencrypt/options-ssl-nginx.conf" ]; then
        sudo curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf -o /etc/letsencrypt/options-ssl-nginx.conf
        sudo curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem -o /etc/letsencrypt/ssl-dhparams.pem
    fi

    print_warning "Requesting certificate. DNS must already point $DOMAIN -> $(curl -s ifconfig.me 2>/dev/null || echo this box)"
    if sudo certbot --nginx -d "$DOMAIN" \
        --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect; then
        print_status "SSL certificate installed"
        sudo nginx -t && sudo systemctl reload nginx
    else
        print_error "Certbot failed - fix DNS / firewall, then re-run: sudo certbot --nginx -d $DOMAIN"
    fi
    install_cron --sudo "certbot renew" \
        "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx"
else
    print_warning "Skipping SSL (--skip-ssl)"
fi

# =============================================================================
# PHASE 6: HEALTH CHECKS + UTILITY SCRIPTS
# =============================================================================

print_section "PHASE 6: HEALTH CHECKS + UTILITIES"

print_step "6.1 Local health checks"
# /login is always available and returns 200 - a clean canary for app readiness.
if curl -sf -o /dev/null http://127.0.0.1:3000/login; then
    print_status "Next.js responding on 127.0.0.1:3000"
else
    print_warning "Next.js not responding - tail $LOG_DIR/web.log and web-error.log"
fi

print_step "6.2 Installing utility scripts"

# Update - pull + reinstall + rebuild + migrate + restart
sudo tee /usr/local/bin/nkabom-update.sh > /dev/null << EOFUPDATE
#!/bin/bash
# Run as the deploy user ($DEPLOY_USER), not via sudo.
set -e
echo "Updating Nkabom..."
cd $PROJECT_DIR
git pull origin $GIT_BRANCH

cd $WEB_DIR
if [ -f package-lock.json ]; then
    NODE_OPTIONS="--max-old-space-size=2048" npm ci
else
    NODE_OPTIONS="--max-old-space-size=2048" npm install
fi
npx prisma migrate deploy
NODE_OPTIONS="--max-old-space-size=2048" npm run build

sudo supervisorctl restart nkabom-web
sudo systemctl reload nginx
echo "Update complete."
EOFUPDATE
sudo chmod +x /usr/local/bin/nkabom-update.sh

# Status snapshot
sudo tee /usr/local/bin/nkabom-status.sh > /dev/null << 'EOFSTATUS'
#!/bin/bash
echo "=== Nkabom Status ==="
echo ""
echo "Service:"
sudo supervisorctl status
echo ""
echo "Firewall:"
sudo ufw status | head -20
echo ""
echo "fail2ban:"
sudo fail2ban-client status sshd 2>/dev/null | grep -E "(Currently|Total)" || echo "Not running"
echo ""
echo "Disk:"
df -h / | tail -1
echo ""
echo "Memory:"
free -h | grep -E "(Mem|Swap)"
echo ""
echo "DB size:"
du -h /var/lib/nkabom/prod.db 2>/dev/null || echo "(DB not present)"
echo ""
echo "Recent log lines:"
sudo tail -n 10 /var/log/nkabom/web.log 2>/dev/null || true
EOFSTATUS
sudo chmod +x /usr/local/bin/nkabom-status.sh

# SQLite backup - uses .backup (atomic, safe while DB is in use)
sudo tee /usr/local/bin/nkabom-backup.sh > /dev/null << EOFBK
#!/bin/bash
set -e
DIR=$BACKUP_DIR
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p "\$DIR"
sqlite3 "$DB_FILE" ".backup '\$DIR/prod_\$DATE.db'"
gzip -f "\$DIR/prod_\$DATE.db"
# Keep 14 days of nightly backups
find "\$DIR" -name "prod_*.db.gz" -mtime +14 -delete
echo "Backup: \$DIR/prod_\$DATE.db.gz"
EOFBK
sudo chmod +x /usr/local/bin/nkabom-backup.sh
install_cron --sudo "nkabom-backup" \
    "0 2 * * * /usr/local/bin/nkabom-backup.sh >> $LOG_DIR/backup.log 2>&1"

print_status "Utility scripts installed"

# =============================================================================
# COMPLETION
# =============================================================================

print_banner
echo -e "${GREEN}"
echo "+------------------------------------------------------------------+"
echo "|                  DEPLOYMENT COMPLETE                             |"
echo "+------------------------------------------------------------------+"
echo -e "${NC}"

cat << EOF

Application URL:
   - https://$DOMAIN     (after DNS + SSL)
   - http://$(curl -s ifconfig.me 2>/dev/null || echo "<instance-ip>")/

Sign-in:
   - Email:    $SEED_ADMIN_EMAIL  (role: admin)
   - Password: ${GENERATED_PASSWORD:+<auto-generated; see line below>}${GENERATED_PASSWORD:-<value you supplied as APP_PASSWORD>}
EOF

if [ "${GENERATED_PASSWORD:-}" = "true" ]; then
cat << EOF
   - APP_PASSWORD = $APP_PASSWORD
     ^ THIS WILL NOT BE PRINTED AGAIN. Copy it now.
     ^ Stored at $WEB_DIR/.env (mode 600) on this box.

EOF
fi

cat << EOF

Paths:
   - Project:    $PROJECT_DIR
   - App:        $WEB_DIR
   - Database:   $DB_FILE
   - Logs:       $LOG_DIR/
   - Backups:    $BACKUP_DIR/
   - .env:       $WEB_DIR/.env  (mode 600)

Utility commands:
   - Status:    /usr/local/bin/nkabom-status.sh
   - Update:    /usr/local/bin/nkabom-update.sh        (run as $DEPLOY_USER, not sudo)
   - Backup:    sudo /usr/local/bin/nkabom-backup.sh
   - Security:  sudo /usr/local/bin/security-check.sh
   - Restart:   sudo supervisorctl restart nkabom-web
   - Logs:      tail -f $LOG_DIR/web.log

Next steps:
   1. If SSL was skipped or failed, run: sudo certbot --nginx -d $DOMAIN
   2. Verify TLS: curl -sI https://$DOMAIN | head
   3. Sign in at https://$DOMAIN/login
   4. Replace placeholder logos in $WEB_DIR/public/brand/ with official artwork
   5. If you want to add more allowlisted users later:
        edit $WEB_DIR/.env (ALLOWED_EMAILS=...), then re-run:
        cd $WEB_DIR && npx prisma db seed
EOF
