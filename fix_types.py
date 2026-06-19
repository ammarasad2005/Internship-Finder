import re

with open('src/lib/supabase/types.ts', 'r') as f:
    content = f.read()

# Add Relationships: any[] to every table (before the closing brace of the table)
# We can find `Update: { ... }` and add it after.
def replacer(match):
    return match.group(0) + '\n        Relationships: any[]'

content = re.sub(r'Update: \{[^}]+\}', replacer, content)

# Add Views, Functions, CompositeTypes before the Enums/Tables closing bracket
content = content.replace('    }\n  }\n}', '    }\n    Views: { [_ in never]: never }\n    Functions: { [_ in never]: never }\n    CompositeTypes: { [_ in never]: never }\n  }\n}')

with open('src/lib/supabase/types.ts', 'w') as f:
    f.write(content)
