# Rental Application
Create/save/print Rental Applications (Node.js version)

This is a port of my Mozilla Firefox Extension [rentap](https://github.com/colinkeenan/rentap) to [npm](https://www.npmjs.com/). You must [install npm](https://docs.npmjs.com/getting-started/installing-node#1-install-nodejs--npm). 

*Rental Application* can easily be run from your user's home folder by following these steps:

## Linux Terminal (ordinary user, no root privilages needed)
### Install
1. `mkdir ~/nodejs`
2. `cd ~/nodejs`
3. `npm install rentap`

### Import store.json From the Firefox (or Icecat) rentap extension
1. Find `store.json` in a hidden subdirectory of your home directory: `find ~/.mozilla -name store.json`
2. Copy or link it to `~/nodejs/node_modules/rentap/import_storejson` Example: `ln -s ~/.mozilla/icecat/vytcev6r.default-1510880606244/jetpack/jid1-E1afJi6vbTfsRg@jetpack/simple-storage/store.json ~/nodejs/node_modules/rentap/import_storejson/store.json`
3. `cd ~/nodejs/node_modules/rentap/import_storejson`
4. `node import_storejson` and follow any prompts if it needs input from you
5. `mv store.db ..`

### Run
1. `cd ~/nodejs/node_modules/rentap`
2. `npm start`
3. Open any browser to http://localhost:3000 or http://127.0.0.1:3000

## Windows Powershell (ordinary user, no Adminstrator privilages needed)
### Install
1. `mkdir ~\nodejs`
2. `cd ~\nodejs`
3. `npm install rentap`

### Import store.json From the Firefox (or Icecat) rentap extension
1. Find `store.json` in a hidden subdirectory of your home directory:`dir ~\AppData -recurse -ea 0 | % FullName | sls "store.json"`
2. Copy it to `~\nodejs\node_modules\rentap\import_storejson` Example: `cp ~\AppData\Roaming\Mozilla\Firefox\Profiles\4wvnz10q.default\jetpack\jid1-E1afJi6vbTfsRg@jetpack\simple-storage\store.json ~\nodejs\node_modules\rentap\import_storejson`
3. `cd ~\nodejs\node_modules\rentap\import_storejson`
4. `node import_storejson` and follow any prompts if it needs input from you
5. `mv store.db ..`

### Run
1. `cd ~\nodejs\node_modules\rentap`
2. `npm start`
3. Open any browser to http://localhost:3000 or http://127.0.0.1:3000
