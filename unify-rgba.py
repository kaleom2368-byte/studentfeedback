import os
import re

css_dir = "public/css"
css_files = [f for f in os.listdir(css_dir) if f.endswith(".css")]

# Purple/Off-blue RGB tuples to standard primary blue (37, 99, 235)
rgb_map = {
    "76, 29, 149": "37, 99, 235",
    "109, 40, 217": "37, 99, 235",
    "167, 139, 250": "37, 99, 235",
    "139, 92, 246": "37, 99, 235",
    "91, 156, 255": "37, 99, 235",
    # Add optional spacing variations
}

def replace_rgba(match):
    r, g, b, rest = match.groups()
    rgb = f"{r.strip()}, {g.strip()}, {b.strip()}"
    if rgb in rgb_map:
        return f"rgba({rgb_map[rgb]}, {rest})"
    return match.group(0)

pattern = re.compile(r'rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([^\)]+)\)')

for file in css_files:
    filepath = os.path.join(css_dir, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern.sub(replace_rgba, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print("Replaced purple/off-brand rgba values with standard blue rgba.")
