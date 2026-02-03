$env:ANDROID_HOME = "C:\Users\Administrator\.gemini\antigravity\scratch\android_sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:PATH"

# Create yes file
"y`ny`ny`ny`ny`ny`ny`ny`ny`ny`n" | Out-File -Encoding ASCII -FilePath y.txt

Write-Host "Accepting Licenses..."
cmd /c "type y.txt | sdkmanager.bat --licenses"

Write-Host "Installing Packages..."
cmd /c "type y.txt | sdkmanager.bat --install ""platform-tools"" ""platforms;android-34"" ""build-tools;34.0.0"""

Write-Host "Done!"
