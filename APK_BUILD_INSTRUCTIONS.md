# How to Build Dracinku APK

Since this is a Native Android project, you need **Android Studio** to compile the final `.apk` file. I have prepared the entire project for you.

## Prerequisites
1.  **Android Studio**: Install from [developer.android.com](https://developer.android.com/studio).
2.  **Java JDK**: Ensure JDK 17+ is installed.

## Steps to Build
1.  Open a terminal in the `dracinbos` folder.
2.  Run the following command to sync your web code to the Android project:
    ```bash
    npx cap sync
    ```
3.  Open the project in Android Studio:
    ```bash
    npx cap open android
    ```
4.  In Android Studio:
    *   Wait for Gradle Sync to finish.
    *   Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
    *   Locate the generated APK in `android/app/build/outputs/apk/debug/app-debug.apk`.

## Configuration
*   **Server URL**: The app is configured to load `https://dracinbos.vercel.app` automatically.
*   **Offline Support**: Currently, it requires an internet connection to load the UI.
