import os
import json
import sys

def path_to_dict(path):
    d = {'name': os.path.basename(path)}
    if os.path.isdir(path):
        d['type'] = "directory"
        d['children'] = [path_to_dict(os.path.join(path,x)) for x in os.listdir(path)]
    else:
        d['type'] = "file"
    return d

# python data/folder-json.py .
print(json.dumps(path_to_dict(sys.argv[1]), indent=4))

if __name__ == "__main__":
    with open("data/directory.json", "w", encoding="utf-8") as f:
        json.dump(path_to_dict(sys.argv[1]), f, indent=4)