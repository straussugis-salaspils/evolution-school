[CmdletBinding()]
param(
    [string]$DraftsPath = "docs/seo/archetypes/production/drafts",
    [string]$ManifestPath = "docs/seo/archetypes/production/portfolio-routes.json",
    [string]$EvidencePath = "docs/seo/archetypes/production/portfolio-evidence.json",
    [switch]$FailOnBlocker,
    [switch]$FailOnPublicationBlocker
)

$ErrorActionPreference = "Stop"

$resolvedDraftsPath = (Resolve-Path -LiteralPath $DraftsPath).Path
$resolvedManifestPath = if (Test-Path -LiteralPath $ManifestPath) {
    (Resolve-Path -LiteralPath $ManifestPath).Path
} else {
    $null
}
$repoRoot = if ($resolvedManifestPath) {
    Split-Path -Parent $resolvedManifestPath
} else {
    (Get-Location).Path
}
while ((Split-Path -Parent $repoRoot) -ne $repoRoot -and
    -not (Test-Path -LiteralPath (Join-Path $repoRoot ".git"))) {
    $repoRoot = Split-Path -Parent $repoRoot
}
$files = @(Get-ChildItem -LiteralPath $resolvedDraftsPath -Filter "*.md" -File |
    Sort-Object Name)

if ($files.Count -eq 0) {
    throw "No Markdown drafts found in $resolvedDraftsPath"
}

$routePatterns = [ordered]@{
    map        = "/arhetipy.html"
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
    three_roles_in_code = "(?i)(?:\u043a\u043e\u0434|\u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442|\u0440\u0430\u0441\u0447[\u0435\u0451]\u0442|\u0441\u043e\u0447\u0435\u0442\u0430\u043d\u0438\u0435)[^\r\n]{0,80}\u0442\u0440[\u0435\u0451]\u0445\s+\u0440\u043e\u043b[\u0435\u0439\u0438]"
    role_in_code        = "(?i)\u0440\u043e\u043b\u044c\s+\u0432\s+\u043a\u043e\u0434\u0435"
    model_method_not_prompt = "(?i)\u0433\u0435\u043d\u0435\u0440\u0430\u0442\u0438\u0432\u043d\u0430\u044f\s+\u043c\u043e\u0434\u0435\u043b\u044c\s+\u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0435\u0442\s+\u0437\u0430\u0444\u0438\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0443\u044e\s+\u043c\u0435\u0442\u043e\u0434\u0438\u043a\u0443"
}

$articleRows = @()
$headingItems = @()
$paragraphItems = @()
$blockers = @()
$manifestIssues = @()
$publicationBlockers = @()
$routeCtaMarkers = 0
$directArticleRoutes = 0

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

    $firstContentLine = @($text -split "\r?\n" |
        Where-Object { $_.Trim().Length -gt 0 } |
        Select-Object -First 1)
    if ($firstContentLine.Count -eq 0 -or
        $firstContentLine[0] -notmatch "^# ") {
        $blockers += [pscustomobject]@{
            File = $file.Name
            Rule = "markdown_must_start_with_h1"
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
    $directRouteIds = @($manifest.render_contract.direct_article_routes)
    $dynamicDestinations = @(
        $manifest.product_destinations.test,
        $manifest.product_destinations.two_week,
        $manifest.product_destinations.strength,
        $manifest.product_destinations.mentoring,
        $manifest.product_destinations.navigator,
        $manifest.product_destinations.retreats
    )

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
        $markers = @([regex]::Matches(
            $assetText,
            '<!--\s*ROUTE_CTA\s+route_id="([^"]+)"\s*-->'
        ))
        $hardcodedDynamicLinks = @([regex]::Matches(
            $assetText,
            "\[([^\]]+)\]\(([^)]+)\)"
        ) | Where-Object {
            $dynamicDestinations -contains $_.Groups[2].Value
        })

        if ($hardcodedDynamicLinks.Count -gt 0) {
            $manifestIssues += [pscustomobject]@{
                File = Split-Path -Leaf $asset.source
                Rule = "hardcoded_dynamic_destination"
            }
        }

        if ($directRouteIds -contains $asset.route_id) {
            $directArticleRoutes++
            $hasExpectedDestination = @($finalLinks | Where-Object {
                $_.Groups[2].Value -eq $asset.destination
            }).Count -gt 0

            if (-not $hasExpectedDestination) {
                $manifestIssues += [pscustomobject]@{
                    File = Split-Path -Leaf $asset.source
                    Rule = "direct_article_destination_mismatch"
                }
            }
            if ($markers.Count -ne 0) {
                $manifestIssues += [pscustomobject]@{
                    File = Split-Path -Leaf $asset.source
                    Rule = "direct_article_must_not_have_route_marker"
                }
            }
        }
        else {
            $routeCtaMarkers += $markers.Count
            if ($markers.Count -ne 1) {
                $manifestIssues += [pscustomobject]@{
                    File = Split-Path -Leaf $asset.source
                    Rule = "route_marker_count_must_equal_one"
                }
            }
            elseif ($markers[0].Groups[1].Value -ne $asset.route_id) {
                $manifestIssues += [pscustomobject]@{
                    File = Split-Path -Leaf $asset.source
                    Rule = "route_marker_id_mismatch"
                }
            }
        }

        if (-not $asset.page_safety_class) {
            $manifestIssues += [pscustomobject]@{
                File = Split-Path -Leaf $asset.source
                Rule = "page_safety_class_missing"
            }
        }
    }

    $profileRouteIds = @(
        $manifest.routing_profiles.PSObject.Properties |
            ForEach-Object { $_.Value.route_ids }
    )
    foreach ($asset in $manifest.assets) {
        $profileHits = @($profileRouteIds |
            Where-Object { $_ -eq $asset.route_id }).Count
        if ($profileHits -ne 1) {
            $manifestIssues += [pscustomobject]@{
                File = $asset.route_id
                Rule = "routing_profile_coverage_must_equal_one"
            }
        }
    }

    foreach ($consolidation in $manifest.consolidations) {
        $asset = @($manifest.assets |
            Where-Object route_id -eq $consolidation.route_id)
        if ($asset.Count -ne 1 -or
            $asset[0].index_state -ne "noindex_follow" -or
            $asset[0].publication_status -ne "hold_consolidation") {
            $manifestIssues += [pscustomobject]@{
                File = $consolidation.route_id
                Rule = "consolidation_state_mismatch"
            }
        }

        foreach ($draft in $files) {
            $draftText = Get-Content -LiteralPath $draft.FullName -Raw -Encoding UTF8
            if ($draftText.Contains("]($($consolidation.proposed_canonical))")) {
                $manifestIssues += [pscustomobject]@{
                    File = $draft.Name
                    Rule = "internal_link_to_consolidation_candidate"
                }
            }
        }
    }

    foreach ($node in $manifest.system_nodes) {
        if ($node.live_http_status -ne 200) {
            $publicationBlockers += [pscustomobject]@{
                File = $node.canonical
                Rule = "required_system_node_not_live"
            }
        }
    }
    if ($manifest.render_contract.publication_state -ne "implemented") {
        $publicationBlockers += [pscustomobject]@{
            File = "render_contract"
            Rule = "publication_runtime_not_implemented"
        }
    }
}
else {
    $manifestIssues += [pscustomobject]@{
        File = $ManifestPath
        Rule = "manifest_missing"
    }
}

$evidence = $null
$evidenceItemCount = 0
$evidenceNeedsLocator = 0
if (Test-Path -LiteralPath $EvidencePath) {
    $evidence = Get-Content -LiteralPath $EvidencePath -Raw -Encoding UTF8 |
        ConvertFrom-Json
    $evidenceRouteIds = @($evidence.routes.route_id)
    $evidenceItems = @($evidence.routes |
        ForEach-Object { $_.evidence_items })
    $evidenceItemCount = $evidenceItems.Count
    $evidenceNeedsLocator = @($evidenceItems |
        Where-Object status -eq "needs_locator").Count

    foreach ($asset in $manifest.assets) {
        if (@($evidenceRouteIds |
            Where-Object { $_ -eq $asset.route_id }).Count -ne 1) {
            $manifestIssues += [pscustomobject]@{
                File = $asset.route_id
                Rule = "evidence_route_coverage_must_equal_one"
            }
        }
    }

    $margaritaDeny = @($evidence.global_deny_rules |
        Where-Object deny_id -eq "DENY-MARGARITA-001")
    if ($margaritaDeny.Count -ne 1) {
        $manifestIssues += [pscustomobject]@{
            File = $EvidencePath
            Rule = "margarita_global_deny_missing"
        }
    }

    if ($evidenceNeedsLocator -gt 0) {
        $publicationBlockers += [pscustomobject]@{
            File = $EvidencePath
            Rule = "evidence_items_need_primary_locator:$evidenceNeedsLocator"
        }
    }

    foreach ($item in $evidenceItems) {
        if ($item.status -ne "verified" -or
            $item.source_path -match "^https?://") {
            continue
        }

        $sourcePath = $item.source_path
        if (-not [System.IO.Path]::IsPathRooted($sourcePath)) {
            $sourcePath = Join-Path $repoRoot $sourcePath
        }
        if (-not (Test-Path -LiteralPath $sourcePath)) {
            $manifestIssues += [pscustomobject]@{
                File = $item.evidence_id
                Rule = "verified_local_source_missing"
            }
        }
    }
}
else {
    $manifestIssues += [pscustomobject]@{
        File = $EvidencePath
        Rule = "evidence_ledger_missing"
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
    IndexAssets = if ($manifest) {
        @($manifest.assets | Where-Object index_state -eq "index").Count
    } else { 0 }
    ConsolidationHolds = if ($manifest) {
        @($manifest.assets |
            Where-Object publication_status -eq "hold_consolidation").Count
    } else { 0 }
    RouteCtaMarkers = $routeCtaMarkers
    DirectArticleRoutes = $directArticleRoutes
    EvidenceItems = $evidenceItemCount
    EvidenceNeedsLocator = $evidenceNeedsLocator
    Blockers = $blockers.Count + $manifestIssues.Count
    PublicationBlockers = $publicationBlockers.Count
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

if ($publicationBlockers.Count -gt 0) {
    Write-Output "PUBLICATION BLOCKERS"
    $publicationBlockers | Format-Table File, Rule -AutoSize
}

if ($FailOnBlocker -and ($blockers.Count + $manifestIssues.Count) -gt 0) {
    exit 1
}

if ($FailOnPublicationBlocker -and $publicationBlockers.Count -gt 0) {
    exit 2
}
