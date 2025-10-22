#!/bin/bash

# Script to help clear browser cache for localhost redirect issue
# Run with: bash clear-browser-cache.sh

echo "🧹 Browser Cache Cleaner for Redirect Fix"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  IMPORTANT: Close ALL browser windows before continuing!${NC}"
echo ""
read -p "Press Enter when all browsers are closed..."

# Detect OS
OS_TYPE=$(uname -s)

if [[ "$OS_TYPE" == "Darwin" ]]; then
    echo -e "${BLUE}🍎 macOS detected${NC}"
    echo ""

    # Chrome
    if [ -d "$HOME/Library/Caches/Google/Chrome" ]; then
        echo -e "${GREEN}🔍 Found Chrome cache${NC}"
        read -p "Clear Chrome cache? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$HOME/Library/Caches/Google/Chrome/Default/Cache"
            echo -e "${GREEN}✅ Chrome cache cleared${NC}"
        fi
    fi

    # Safari
    if [ -d "$HOME/Library/Caches/com.apple.Safari" ]; then
        echo -e "${GREEN}🔍 Found Safari cache${NC}"
        read -p "Clear Safari cache? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$HOME/Library/Caches/com.apple.Safari"
            echo -e "${GREEN}✅ Safari cache cleared${NC}"
        fi
    fi

    # Firefox
    if [ -d "$HOME/Library/Caches/Firefox" ]; then
        echo -e "${GREEN}🔍 Found Firefox cache${NC}"
        read -p "Clear Firefox cache? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$HOME/Library/Caches/Firefox/Profiles/*/cache2"
            echo -e "${GREEN}✅ Firefox cache cleared${NC}"
        fi
    fi

    # Brave
    if [ -d "$HOME/Library/Application Support/BraveSoftware/Brave-Browser" ]; then
        echo -e "${GREEN}🔍 Found Brave cache${NC}"
        read -p "Clear Brave cache? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$HOME/Library/Caches/BraveSoftware/Brave-Browser/Default/Cache"
            echo -e "${GREEN}✅ Brave cache cleared${NC}"
        fi
    fi

elif [[ "$OS_TYPE" == "Linux" ]]; then
    echo -e "${BLUE}🐧 Linux detected${NC}"
    echo ""

    # Chrome/Chromium
    if [ -d "$HOME/.cache/google-chrome" ]; then
        echo -e "${GREEN}🔍 Found Chrome cache${NC}"
        read -p "Clear Chrome cache? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$HOME/.cache/google-chrome"
            echo -e "${GREEN}✅ Chrome cache cleared${NC}"
        fi
    fi

    # Firefox
    if [ -d "$HOME/.cache/mozilla/firefox" ]; then
        echo -e "${GREEN}🔍 Found Firefox cache${NC}"
        read -p "Clear Firefox cache? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$HOME/.cache/mozilla/firefox"
            echo -e "${GREEN}✅ Firefox cache cleared${NC}"
        fi
    fi

else
    echo -e "${YELLOW}⚠️  Windows detected or unknown OS${NC}"
    echo "Please manually clear cache through browser settings"
    echo ""
    echo "Chrome: chrome://settings/clearBrowserData"
    echo "Firefox: about:preferences#privacy"
    echo "Edge: edge://settings/clearBrowserData"
fi

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Start your browser"
echo "2. Visit http://localhost:3000"
echo "3. You should see the new homepage!"
echo ""
echo "If it still redirects:"
echo "- Try Cmd+Shift+R (hard refresh)"
echo "- Or use private/incognito mode"
echo ""
