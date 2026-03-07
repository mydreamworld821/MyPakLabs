#!/bin/bash
# ============================================
# Android Build Fix Script for Capacitor
# Fixes Java 25 compatibility by forcing Java 21 toolchain
# ============================================

set -e

echo "🔧 Setting up Android build configuration..."

# Check if android directory exists
if [ ! -d "android" ]; then
    echo "❌ android/ directory not found. Run these first:"
    echo "   npx cap add android"
    echo "   Then re-run this script."
    exit 1
fi

# Step 1: Patch gradle.properties
echo "📝 Step 1/4: Patching gradle.properties..."
cp android-build-fix/gradle.properties.patch android/gradle.properties
echo "   ✅ gradle.properties updated (auto-download Java toolchain enabled)"

# Step 2: Patch root build.gradle
echo "📝 Step 2/4: Patching build.gradle..."
cp android-build-fix/build.gradle.patch android/build.gradle
echo "   ✅ build.gradle updated (AGP 8.2.2, repositories configured)"

# Step 3: Patch app/build.gradle
echo "📝 Step 3/4: Patching app/build.gradle..."
cp android-build-fix/app-build.gradle.patch android/app/build.gradle
echo "   ✅ app/build.gradle updated (Java 21 compileOptions)"

# Step 4: Patch gradle-wrapper.properties
echo "📝 Step 4/4: Patching gradle-wrapper.properties..."
cp android-build-fix/gradle-wrapper.properties.patch android/gradle/wrapper/gradle-wrapper.properties
echo "   ✅ gradle-wrapper.properties updated (Gradle 8.7)"

# Sync Capacitor
echo ""
echo "🔄 Syncing Capacitor..."
npx cap sync android

echo ""
echo "============================================"
echo "✅ Android build configuration complete!"
echo ""
echo "Build commands:"
echo "  cd android"
echo ""
echo "  # Clean build"
echo "  ./gradlew clean"
echo ""
echo "  # Build APK"
echo "  ./gradlew assembleRelease"
echo "  # Output: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "  # Build AAB (Play Store)"
echo "  ./gradlew bundleRelease"
echo "  # Output: android/app/build/outputs/bundle/release/app-release.aab"
echo "============================================"
