# PowerShell script to copy Next.js build output to the correct location
# This ensures compatibility with Windows environments

Write-Host "Copying build output to goldenoxtari/server/frontend/out..." -ForegroundColor Green

# Ensure the destination directory exists
$destDir = "..\goldenoxtari\server\frontend\out"
if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

# Copy all files from out directory to destination
if (Test-Path "out") {
    Copy-Item -Path "out\*" -Destination $destDir -Recurse -Force
    Write-Host "Files copied successfully!" -ForegroundColor Green
    
    # Clean up the temporary out directory
    Remove-Item -Path "out" -Recurse -Force
    Write-Host "Temporary out directory cleaned up." -ForegroundColor Green
} else {
    Write-Host "Warning: out directory not found. Make sure 'next build' completed successfully." -ForegroundColor Yellow
}
