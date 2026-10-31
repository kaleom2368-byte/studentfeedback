import os
import re

css_dir = "public/css"
css_files = [f for f in os.listdir(css_dir) if f.endswith(".css")]

# Purple to Blue Mapping
color_map = {
    # Purples
    "#7c3aed": "#2563eb",
    "#6d28d9": "#2563eb",
    "#5b21b6": "#1d4ed8",
    "#4c1d95": "#1e40af",
    "#8b5cf6": "#3b82f6",
    "#a78bfa": "#60a5fa",
    "#c4b5fd": "#93c5fd",
    "#ddd6fe": "#bfdbfe",
    "#ede9fe": "#dbeafe",
    "#f5f3ff": "#eff6ff",
    "#f3efff": "#eff6ff",
    "#f7f4ff": "#eff6ff",
    "#f5f0ff": "#eff6ff",
    "#faf9ff": "#ffffff",
    "#312e81": "#1e40af",
    
    # Weird greens or alternative blues to standard blue
    "#326ed1": "#2563eb",
    "#275db7": "#1d4ed8",
    "#2454a6": "#1e40af",
    "#5b9cff": "#3b82f6",
    "#78adff": "#60a5fa",
    "#3d82ed": "#2563eb",
}

# Add 3-letter hex variants if applicable
# For this script we will only replace exactly matched colors in the files.
keys_sorted = sorted(list(color_map.keys()), key=len, reverse=True)
pattern = re.compile(r'(' + '|'.join(keys_sorted) + r')(?![0-9a-fA-F])', re.IGNORECASE)

for file in css_files:
    filepath = os.path.join(css_dir, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern.sub(lambda m: color_map[m.group(0).lower()], content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print("Safely replaced purple and off-brand colors with standard blue.")
