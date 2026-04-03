#!/bin/bash
# Capture real App UI screenshots for App Store marketing
# Requires: App running in simulator via Expo Go

UDID="77AC39B0-A1C4-4C09-9158-B4C6F7CC2B90"
PORT=8095
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$SCRIPT_DIR/public/app-captures"

LOCALES="en zh-Hans zh-Hant ja ko de fr es ru it ar id"
SCREENS="dashboard timeline profile settings log"

# Ensure output dir exists
mkdir -p "$OUTPUT"

for locale in $LOCALES; do
  echo "=== Capturing locale: $locale ==="
  mkdir -p "$OUTPUT/$locale"

  # Switch language via deep link
  xcrun simctl openurl "$UDID" "exp://localhost:$PORT/--/?locale=$locale"
  sleep 3

  # Dashboard
  xcrun simctl openurl "$UDID" "exp://localhost:$PORT/--/(tabs)"
  sleep 2
  xcrun simctl io "$UDID" screenshot "$OUTPUT/$locale/dashboard.png"
  echo "  captured: dashboard"

  # Timeline
  xcrun simctl openurl "$UDID" "exp://localhost:$PORT/--/(tabs)/timeline"
  sleep 2
  xcrun simctl io "$UDID" screenshot "$OUTPUT/$locale/timeline.png"
  echo "  captured: timeline"

  # Cat Profile
  xcrun simctl openurl "$UDID" "exp://localhost:$PORT/--/(tabs)/profile"
  sleep 2
  xcrun simctl io "$UDID" screenshot "$OUTPUT/$locale/profile.png"
  echo "  captured: profile"

  # Settings
  xcrun simctl openurl "$UDID" "exp://localhost:$PORT/--/(tabs)/settings"
  sleep 2
  xcrun simctl io "$UDID" screenshot "$OUTPUT/$locale/settings.png"
  echo "  captured: settings"

  # Log Entry (modal - navigate back to dashboard first)
  xcrun simctl openurl "$UDID" "exp://localhost:$PORT/--/log"
  sleep 2
  xcrun simctl io "$UDID" screenshot "$OUTPUT/$locale/log.png"
  echo "  captured: log"

  # Return to dashboard for next locale
  xcrun simctl openurl "$UDID" "exp://localhost:$PORT/--/(tabs)"
  sleep 1

  echo "  Done with $locale"
done

echo ""
echo "=== All captures complete ==="
echo "Total: $(find "$OUTPUT" -name '*.png' | wc -l | tr -d ' ') screenshots"
