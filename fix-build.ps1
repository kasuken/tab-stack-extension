# Fix build output structure
$distPath = "dist"
if (Test-Path "$distPath\src\popup.html") {
    Move-Item "$distPath\src\popup.html" "$distPath\popup.html" -Force
    Remove-Item "$distPath\src" -Recurse -Force
    Write-Host "Fixed popup.html location"
}

# Remove unnecessary files
if (Test-Path "$distPath\vite.svg") {
    Remove-Item "$distPath\vite.svg" -Force
}

Write-Host "Extension build complete!"
Write-Host "Load the 'dist' folder as an unpacked extension in Chrome/Edge"
Write-Host ""
Write-Host "Chrome: chrome://extensions/ -> Enable Developer mode -> Load unpacked"
Write-Host "Edge: edge://extensions/ -> Enable Developer mode -> Load unpacked"
