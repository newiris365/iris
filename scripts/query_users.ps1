$url = "https://bxdfmlqzstwcsujdgejn.supabase.co/rest/v1/users?institution_id=eq.33333333-3333-3333-3333-333333333333"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZGZtbHF6c3R3Y3N1amRnZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY5NDI1NSwiZXhwIjoyMDk3MjcwMjU1fQ.fjEetR8U5JIz3YuFpz6m7TJK6gifRGhHiJxd7A8d1dM"
$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
}
$response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
$response | ConvertTo-Json -Depth 5
