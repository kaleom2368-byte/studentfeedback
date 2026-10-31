import os
import re

css_dir = "public/css"
css_files = [f for f in os.listdir(css_dir) if f.endswith(".css") and f != "global.css"]

color_map = {
    # Whites and backgrounds
    "#fff": "var(--card-bg)",
    "#ffffff": "var(--card-bg)",
    "#f8fafc": "var(--page-bg)",
    "#f9fafb": "var(--page-bg)",
    "#f3f4f6": "var(--page-bg)",
    "#f1f5f9": "var(--border-light)",
    "#f0fdf4": "var(--success-bg)",
    "#fef2f2": "var(--danger-bg)",
    "#fffbeb": "var(--warning-bg)",
    "#dbeafe": "var(--primary-bg)",
    "#eff6ff": "var(--primary-bg-subtle)",
    "#fafafa": "var(--card-bg)",
    
    # Darks / Texts
    "#000": "var(--text)",
    "#333": "var(--text)",
    "#1e293b": "var(--text)",
    "#0f172a": "var(--text)",
    "#111827": "var(--text)",
    "#334155": "var(--text-secondary)",
    "#475569": "var(--text-secondary)",
    "#64748b": "var(--text-muted)",
    "#94a3b8": "var(--text-light)",
    "#cbd5e1": "var(--input-border)",
    "#e2e8f0": "var(--border)",
    "#d1d5db": "var(--input-border)",
    "#e5e7eb": "var(--border)",
    "#f0f1f5": "var(--border-light)",
    
    # Primary Blues / Purples (convert all to Primary)
    "#2563eb": "var(--primary)",
    "#1d4ed8": "var(--primary-dark)",
    "#1e40af": "var(--primary-dark)",
    "#3b82f6": "var(--primary)",
    "#60a5fa": "var(--primary-accent)",
    "#003366": "var(--primary-dark)",
    "#00509e": "var(--primary)",
    "#004e92": "var(--primary-dark)",
    "#4c1d95": "var(--primary-dark)",
    "#5b21b6": "var(--primary)",
    "#7c3aed": "var(--primary)",
    "#8b5cf6": "var(--primary-accent)",
    "#667eea": "var(--primary)",
    "#764ba2": "var(--primary-dark)",
    "#4facfe": "var(--primary)",
    "#00f2fe": "var(--primary-accent)",
    
    # Success
    "#16a34a": "var(--success)",
    "#22c55e": "var(--success)",
    "#15803d": "var(--success)",
    "#10b981": "var(--success)",
    "#34d399": "var(--success)",
    
    # Danger
    "#dc2626": "var(--danger)",
    "#ef4444": "var(--danger)",
    "#b91c1c": "var(--danger)",
    "#f87171": "var(--danger-border)",
    "#fca5a5": "var(--danger-border)",
    
    # Warning
    "#d97706": "var(--warning)",
    "#f59e0b": "var(--warning)",
    "#fbbf24": "var(--warning-border)",
    "#ffd700": "var(--warning)",
}

# Also handle 3-letter hex versions
keys = list(color_map.keys())
for k in keys:
    if len(k) == 7 and k[1] == k[2] and k[3] == k[4] and k[5] == k[6]:
        short_k = "#" + k[1] + k[3] + k[5]
        if short_k not in color_map:
            color_map[short_k] = color_map[k]

# Map for regex
keys_sorted = sorted(list(color_map.keys()), key=len, reverse=True)
pattern = re.compile(r'(' + '|'.join(keys_sorted) + r')(?![0-9a-fA-F])', re.IGNORECASE)

# Some CSS files might have other random hex colors. We want to convert ALL of them to closest matches? 
# To be safe, if a hex color isn't in our map, we just leave it alone, or we can use a regex to catch ALL hex colors 
# and replace them with generic variables based on some logic.
# Given the user wants everything the SAME colour and shade, let's catch ALL hex colors.
all_hex_pattern = re.compile(r'#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])')

def replacer(match):
    color = match.group(0).lower()
    if color in color_map:
        return color_map[color]
        
    # If not in map, let's guess based on its length and generic presence
    # Very crude fallback:
    if color.startswith('#0') or color.startswith('#1') or color.startswith('#2') or color.startswith('#3'):
        return "var(--primary-dark)"
    if color.startswith('#f') or color.startswith('#e'):
        return "var(--page-bg)"
    return "var(--primary)"

for file in css_files:
    filepath = os.path.join(css_dir, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We replace known colors first
    new_content = pattern.sub(lambda m: color_map[m.group(0).lower()], content)
    
    # Then we replace any remaining stray hex colors with our replacer fallback
    new_content = all_hex_pattern.sub(replacer, new_content)
    
    # Prepend global.css import
    if "@import url('/css/global.css');" not in new_content:
        new_content = "@import url('/css/global.css');\n" + new_content
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print(f"Processed {len(css_files)} CSS files.")
