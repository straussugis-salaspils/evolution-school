[CmdletBinding()]
param(
    [string]$DraftsPath = "docs/seo/archetypes/production/drafts",
    [string]$ManifestPath = "docs/seo/archetypes/production/portfolio-routes.json",
    [switch]$FailOnBlocker
)

$ErrorActionPreference = "Stop"

$resolvedDraftsPath = (Resolve-Path -LiteralPath $DraftsPath).Path
$files = @(Get-ChildItem -LiteralPath $resolvedDraftsPath -Filter "*.md" -File |
    Sort-Object Name)

if ($files.Count -eq 0) {
    throw "No Markdown drafts found in $resolvedDraftsPath"
}

$routePatterns = [ordered]@{
    test       = "/test-arhetipov/"
    mentoring  = "/mentoring/"
    lightness  = "/lightness/"
    strength   = "/strength/"
    retreats   = "/retreats/"
    navigator  = "/pervyi-shag.html"
    method     = "/arhetipy-method.html"
}

$blockerPatterns = [ordered]@{
    margarita_case      = "(?i)\b\u043c\u0430\u0440\u0433\u0430\u0440\u0438\u0442[\p{L}]*\b"
    psychological_quiz = "(?i)\u043f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a[\p{L}]*\s+\u0442\u0435\u0441\u0442|\u043e\u0442\u0432\u0435\u0442\u044c\u0442\u0435\s+\u043d\u0430\s+\u0432\u043e\u043f\u0440\u043e\u0441\u044b"
    main_archetype      = "(?i)\u0443\u0437\u043d\u0430\u0439\u0442\u0435\s+\u0441\u0432\u043e\u0439\s+\u0433\u043b\u0430\u0432\u043d[\p{L}]*\s+\u0430\u0440\u0445\u0435\u0442\u0438\u043f"
    dictation_marker    = "(?i)\[\u041d\u0423\u0416\u041d\u0410\s+\u0414\u0418\u041a\u0422\u041e\u0412\u041a\u0410\s+\u0421\u0412\u0415\u0422\u041b\u0410\u041d\u042b"
}

$articleRows = @()
$headingItems = @()
$paragraphItems = @()
$blockers = @()
$manifestIssues = @()

foreach ($file in $files) {
    $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    $h1Match = [regex]::Match($text, "(?m)^# (.+)$")
    $links = @([regex]::Matches($text, "\[([^\]]+)\]\(([^)]+)\)"))
    $headings = @([regex]::Matches($text, "(?m)^## (.+)$"))
    $wordCount = [regex]::Matches($text, "[\p{L}\p{N}]+").Count

    $routeHits = [ordered]@{}
    foreach ($route in $routePatterns.GetEnumerator()) {
        $routeHits[$route.Key] = @($links | Where-Object {
            $_.Groups[2].Value -like "$($route.Value)*"
        }).Count
    }

    foreach ($heading in $headings) {
        $headingItems += [pscustomobject]@{
            Heading = $heading.Groups[1].Value.Trim()
            File = $file.Name
        }
    }

    foreach ($paragraph in ($text -split "(?:\r?\n){2,}")) {
        $normalized = ($paragraph -replace "\s+", " ").Trim()
        if ($normalized.Length -ge 100) {
            $paragraphItems += [pscustomobject]@{
                Text = $normalized
                File = $file.Name
            }
        }
    }

    foreach ($pattern in $blockerPatterns.GetEnumerator()) {
        if ($text -match $pattern.Value) {
            $blockers += [pscustomobject]@{
                File = $file.Name
                Rule = $pattern.Key
            }
        }
    }

    $articleRows += [pscustomobject]@{
        File = $file.Name
        Words = $wordCount
        H1 = $h1Match.Groups[1].Value
        Links = $links.Count
        Test = $routeHits.test
        Mentoring = $routeHits.mentoring
        Lightness = $routeHits.lightness
        Strength = $routeHits.strength
        Retreats = $routeHits.retreats
        Navigator = $routeHits.navigator
        Method = $routeHits.method
    }
}

$duplicateHeadings = @($headingItems |
    Group-Object Heading |
    Where-Object Count -gt 1 |
    Sort-Object -Property `
        @{Expression = "Count"; Descending = $true}, `
        @{Expression = "Name"; Ascending = $true})

$duplicateParagraphs = @($paragraphItems |
    Group-Object Text |
    Where-Object Count -gt 1 |
    Sort-Object Count -Descending)

$manifest = $null
if (Test-Path -LiteralPath $ManifestPath) {
    $manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 |
        ConvertFrom-Json

    $manifestFileNames = @($manifest.assets.source |
        ForEach-Object { Split-Path -Leaf $_ })
    $draftFileNames = @($files.Name)

    foreach ($fileName in $draftFileNames) {
        if ($manifestFileNames -notcontains $fileName) {
            $manifestIssues += [pscustomobject]@{
                File = $fileName
                Rule = "draft_missing_from_manifest"
            }
        }
    }

    foreach ($fileName in $manifestFileNames) {
        if ($draftFileNames -notcontains $fileName) {
            $manifestIssues += [pscustomobject]@{
                File = $fileName
                Rule = "manifest_source_missing"
            }
        }
    }

    foreach ($duplicate in @($manifest.assets | Group-Object route_id |
        Where-Object Count -gt 1)) {
        $manifestIssues += [pscustomobject]@{
            File = $duplicate.Name
            Rule = "duplicate_route_id"
        }
    }

    foreach ($duplicate in @($manifest.assets | Group-Object canonical |
        Where-Object Count -gt 1)) {
        $manifestIssues += [pscustomobject]@{
            File = $duplicate.Name
            Rule = "duplicate_canonical"
        }
    }

    $productionPath = Split-Path -Parent $resolvedDraftsPath
    foreach ($asset in $manifest.assets) {
        $assetPath = Join-Path $productionPath $asset.source
        if (-not (Test-Path -LiteralPath $assetPath)) {
            continue
        }

        $assetText = Get-Content -LiteralPath $assetPath -Raw -Encoding UTF8
        $assetHeadings = @([regex]::Matches($assetText, "(?m)^## (.+)$"))
        if ($assetHeadings.Count -eq 0) {
            $manifestIssues += [pscustomobject]@{
                File = Split-Path -Leaf $asset.source
                Rule = "final_section_missing"
            }
            continue
        }

        $lastHeading = $assetHeadings[-1]
        $finalSection = $assetText.Substring($lastHeading.Index)
        $finalLinks = @([regex]::Matches(
            $finalSection,
            "\[([^\]]+)\]\(([^)]+)\)"
        ))
        $hasExpectedDestination = @($finalLinks | Where-Object {
            $_.Groups[2].Value -eq $asset.destination
        }).Count -gt 0

        if (-not $hasExpectedDestination) {
            $manifestIssues += [pscustomobject]@{
                File = Split-Path -Leaf $asset.source
                Rule = "final_destination_mismatch"
            }
        }
    }
}
else {
    $manifestIssues += [pscustomobject]@{
        File = $ManifestPath
        Rule = "manifest_missing"
    }
}

$summary = [pscustomobject]@{
    Files = $files.Count
    Words = ($articleRows | Measure-Object Words -Sum).Sum
    TestLinks = ($articleRows | Measure-Object Test -Sum).Sum
    MentoringLinks = ($articleRows | Measure-Object Mentoring -Sum).Sum
    LightnessLinks = ($articleRows | Measure-Object Lightness -Sum).Sum
    StrengthLinks = ($articleRows | Measure-Object Strength -Sum).Sum
    RetreatLinks = ($articleRows | Measure-Object Retreats -Sum).Sum
    NavigatorLinks = ($articleRows | Measure-Object Navigator -Sum).Sum
    DuplicateH2 = $duplicateHeadings.Count
    DuplicateLongParagraphs = $duplicateParagraphs.Count
    ManifestAssets = if ($manifest) { $manifest.assets.Count } else { 0 }
    Blockers = $blockers.Count + $manifestIssues.Count
}

Write-Output "PORTFOLIO SUMMARY"
$summary | Format-List

Write-Output "ARTICLE ROUTES"
$articleRows | Format-Table File, Words, Test, Mentoring, Lightness, Strength,
    Retreats, Navigator, Method -AutoSize

Write-Output "REPEATED H2"
$duplicateHeadings |
    Select-Object Count, Name |
    Format-Table -AutoSize

Write-Output "REPEATED LONG PARAGRAPHS"
$duplicateParagraphs |
    Select-Object -First 20 `
        @{Name = "Count"; Expression = { $_.Count }}, `
        @{Name = "Files"; Expression = { $_.Group.File -join ", " }}, `
        @{Name = "Text"; Expression = { $_.Name }} |
    Format-List

if ($manifest) {
    Write-Output "MANIFEST DESTINATIONS"
    $manifest.assets |
        Group-Object destination |
        Sort-Object Name |
        Select-Object Count, Name |
        Format-Table -AutoSize
}

if ($blockers.Count -gt 0) {
    Write-Output "BLOCKERS"
    $blockers | Format-Table File, Rule -AutoSize
}

if ($manifestIssues.Count -gt 0) {
    Write-Output "MANIFEST BLOCKERS"
    $manifestIssues | Format-Table File, Rule -AutoSize
}

if ($FailOnBlocker -and ($blockers.Count + $manifestIssues.Count) -gt 0) {
    exit 1
}
