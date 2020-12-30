import json
from glob import glob

def collate(d):
    all_data = []
    for path in glob(f'data/{d}/**/*.json', recursive=True):
        with open(path) as f:
            data = json.load(f)
            all_data.append(data)

    with open(f'data/{d}.json', 'w') as f:
        f.write(json.dumps(all_data))

for d in ['programs', 'tasks', 'languages']:
    collate(d)
