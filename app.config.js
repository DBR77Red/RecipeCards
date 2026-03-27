const isProd = process.env.APP_ENV === 'production';

module.exports = {
  expo: {
    name: "RecipeCards",
    slug: "RecipeCards",
    version: "1.0.0",
    orientation: "portrait",
    icon: isProd ? "./assets/icon-prod.png" : "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1C0F06",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.camelo.recipecards",
      adaptiveIcon: {
        backgroundColor: "#1C0F06",
        foregroundImage: isProd
          ? "./assets/android-icon-foreground-prod.png"
          : "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            // Only build for real-device ABIs; x86/x86_64 are emulator-only and inflate APK size
            architectures: ["arm64-v8a", "armeabi-v7a"],
            // R8 code shrinking and unused-resource stripping for release builds
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
        },
      ],
      "expo-font",
      [
        "expo-camera",
        {
          cameraPermission:
            "Allow RecipeCards to use your camera to scan recipe QR codes.",
        },
      ],
      [
        "expo-audio",
        {
          microphonePermission:
            "Allow RecipeCards to use your microphone to record recipe instructions.",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "21dbaff6-a3aa-4696-bda3-439d6bfc3da7",
      },
    },
  },
};
