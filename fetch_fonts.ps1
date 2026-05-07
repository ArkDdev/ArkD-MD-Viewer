mkdir public\fonts -Force | Out-Null

$base = "https://cdn.jsdelivr.net/fontsource/fonts"
$dest = "public\fonts"

curl.exe "$base/inter@latest/latin-400-normal.woff2" -o "$dest\inter-latin-400.woff2"
curl.exe "$base/inter@latest/cyrillic-400-normal.woff2" -o "$dest\inter-cyrillic-400.woff2"
curl.exe "$base/inter@latest/latin-700-normal.woff2" -o "$dest\inter-latin-700.woff2"
curl.exe "$base/inter@latest/cyrillic-700-normal.woff2" -o "$dest\inter-cyrillic-700.woff2"

curl.exe "$base/source-serif-4@latest/latin-400-normal.woff2" -o "$dest\source-serif-4-latin-400.woff2"
curl.exe "$base/source-serif-4@latest/cyrillic-400-normal.woff2" -o "$dest\source-serif-4-cyrillic-400.woff2"
curl.exe "$base/source-serif-4@latest/latin-400-italic.woff2" -o "$dest\source-serif-4-latin-400-italic.woff2"
curl.exe "$base/source-serif-4@latest/latin-700-normal.woff2" -o "$dest\source-serif-4-latin-700.woff2"
curl.exe "$base/source-serif-4@latest/cyrillic-700-normal.woff2" -o "$dest\source-serif-4-cyrillic-700.woff2"

curl.exe "$base/jetbrains-mono@latest/latin-400-normal.woff2" -o "$dest\jetbrains-mono-latin-400.woff2"
curl.exe "$base/jetbrains-mono@latest/cyrillic-400-normal.woff2" -o "$dest\jetbrains-mono-cyrillic-400.woff2"
curl.exe "$base/jetbrains-mono@latest/latin-700-normal.woff2" -o "$dest\jetbrains-mono-latin-700.woff2"