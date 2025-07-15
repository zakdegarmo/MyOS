# Analyze-DiskUsage.ps1 - MyOS Disk Analysis Tool
# Description: Recursively analyzes disk usage for a specified path.
#              This version focuses on direct user control and verbose output.

function Analyze-DiskUsage {
    param (
        [string]$BasePath = "" # Default to empty string to trigger prompt
    )

    if ([string]::IsNullOrWhiteSpace($BasePath)) {
        $userInput = Read-Host "Enter the base path to analyze (e.g., C:\Users\zakde\ or C:\). Press Enter for current directory."
        if ([string]::IsNullOrWhiteSpace($userInput)) {
            $BasePath = (Get-Location).Path # Use current working directory
        } else {
            $BasePath = $userInput
        }
    }

    # >>>>>>>>>>> YOU CAN EDIT THIS LIST IN THIS FILE TO CONTROL EXCLUSIONS <<<<<<<<<<<
    # This list is empty by default, as per your instruction.
    # If you experience hangs or errors on specific directories (like NLBL fractals, Windows, Program Files),
    # you MUST add their FULL PATHS to this list here to exclude them from recursive scanning.
    $excludeFolders = @(
        # Example: "C:\Users\zakde\Desktop\NLBL9",
        # Example: "C:\Windows",
        # Example: "C:\Program Files (x86)"
    )
    # >>>>>>>>>>> END USER-EDITABLE EXCLUSION LIST <<<<<<<<<<<

    Write-Host "Analyzing disk usage for: $BasePath (excluding specified problematic directories)"
    Write-Host "--------------------------------------------------------------------------------"

    # Get direct subdirectories of the base path
    Get-ChildItem -Path $BasePath -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $currentTopLevelFolder = $_.FullName
        
        # Check if this top-level folder is in our user-defined exclude list
        $isExcluded = $false
        foreach ($excludePath in $excludeFolders) {
            # Check if current folder is exactly an excluded path OR starts with an excluded path
            if ($currentTopLevelFolder -eq $excludePath -or $currentTopLevelFolder.StartsWith($excludePath + "\")) {
                $isExcluded = $true
                break
            }
        }

        if ($isExcluded) {
            Write-Host "$currentTopLevelFolder - SKIPPED (Excluded by User Configuration)"
            return # Skip to the next top-level folder
        }
        
        try {
            # Perform recursive scan for items within the non-excluded top-level folder
            # This WILL attempt to scan everything unless explicitly excluded above.
            $items = Get-ChildItem -Path $currentTopLevelFolder -Recurse -ErrorAction SilentlyContinue 
            
            # Filter for files before measuring Length and counting
            $filesOnly = $items | Where-Object { -not $_.PSIsContainer }
            $fileCount = $filesOnly.Count
            $totalSize = ($filesOnly | Measure-Object -Property Length -Sum).Sum
            
            # Format size to GB
            $sizeGB = [Math]::Round($totalSize / 1GB, 2)
            
            Write-Host "$currentTopLevelFolder - $($sizeGB) GB - ($fileCount files)"
        }
        catch {
            Write-Host "$currentTopLevelFolder - ACCESS DENIED or ERROR: $($_.Exception.Message)"
        }
    }
    
    Write-Host "--------------------------------------------------------------------------------"
    Write-Host "Scan complete for: $BasePath"
    Write-Host "To copy logs, select text in this window and right-click to copy."
}