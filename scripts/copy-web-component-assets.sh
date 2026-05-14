#!/bin/bash

# Script to copy web-component files to platform-specific asset directories
# This ensures the WebView can load the HTML file on both Android and iOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_DIR="$PROJECT_ROOT/public/web-component"
ANDROID_ASSETS_DIR="$PROJECT_ROOT/android/app/src/main/assets/web-component"

echo "Copying web-component files to Android assets..."

# Create Android assets directory if it doesn't exist
mkdir -p "$ANDROID_ASSETS_DIR"

# Copy all files from public/web-component to Android assets
cp -r "$SOURCE_DIR"/* "$ANDROID_ASSETS_DIR/"

echo "✓ Web-component files copied to Android assets: $ANDROID_ASSETS_DIR"
echo ""
echo "For iOS:"
echo "1. Open the project in Xcode: ios/MyApp.xcworkspace"
echo "2. Right-click on the MyApp folder in the Project Navigator"
echo "3. Select 'Add Files to MyApp...'"
echo "4. Navigate to: $SOURCE_DIR"
echo "5. Select all files (index.html, questionnaire-player-webcomponent.js, styles.css, theme.css)"
echo "6. Ensure 'Create folder references' is selected (not 'Create groups')"
echo "7. Ensure 'Copy items if needed' is checked"
echo "8. Ensure 'Add to targets: MyApp' is checked"
echo "9. Click 'Add'"
echo ""
echo "The files will be accessible at: file:///web-component/index.html in iOS WebView"

