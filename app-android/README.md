# FUN Lingo — Android app

GitHub builds the Android app automatically (`.github/workflows/android.yml`) every time
something in `www/` or here changes:

1. copies `www/` into this folder,
2. wraps it with Capacitor (offline: everything is inside the app),
3. sets the app icon, splash screen, full screen and sideways-only,
4. builds `FUN-Lingo-debug.apk`.

Download it from the repo's **Actions** tab → newest "Build Android app" run → **Artifacts**.

This is a test build (debug signing). For the Play Store a release key is needed later.
