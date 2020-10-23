# Expressiveness Benchmark

## Setup

```
python3 -m venv .env && source .env/bin/activate
pip3 install -e .
pushd code_widget
pip3 install -e .
jupyter nbextension install --sys-prefix --symlink --overwrite --py code_widget
jupyter nbextension enable --sys-prefix --py code_widget
npm link
popd
npm install
npm run watch
```
