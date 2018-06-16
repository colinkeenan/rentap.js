# Rental Application
Create/save/print Rental Applications (Node.js version)

This is a port of my Mozilla Firefox Extension [rentap](https://github.com/colinkeenan/rentap) to [npm](https://www.npmjs.com/). You must [install npm](https://docs.npmjs.com/getting-started/installing-node#1-install-nodejs--npm). 

*Rental Application* can easily be run from your user's home folder by following these steps:

## For Windows instructions, click [here](https://github.com/colinkeenan/rentap.js#windows-powershell-ordinary-user-no-adminstrator-privilages-needed)

## Linux Terminal (ordinary user, no root privilages needed)
### Install
1. `mkdir ~/nodejs`
2. `cd ~/nodejs`
3. `npm install rentap`

### (Optional) Import store.json From the Firefox (or Icecat) rentap extension
1. Find `store.json` in a hidden subdirectory of your home directory: `find ~/.mozilla -name store.json`
2. Copy or link it to `~/nodejs/node_modules/rentap/import_storejson` Example: `ln -s ~/.mozilla/icecat/vytcev6r.default-1510880606244/jetpack/jid1-E1afJi6vbTfsRg@jetpack/simple-storage/store.json ~/nodejs/node_modules/rentap/import_storejson/store.json`
3. `cd ~/nodejs/node_modules/rentap/import_storejson`
4. `node import_storejson` and follow any prompts if it needs input from you
5. `mv store.db ..`

### Run
1. `cd ~/nodejs/node_modules/rentap`
2. `npm start`
3. Open any browser to http://localhost:3000 or http://127.0.0.1:3000
4. Stop the www server with `npm stop`

### (Optional) Google Appifying it and using a script to automatically run npm start
1. Run as above and open in Google Chrome
2. Click the 3-vertical-dot Google Chrome menu and choose More Tools -> Create Shortcut...
3. Checkmark "Open As Window" if you want it to look like a separate ap instead of a tab
4. Find the desktop file created by Google Chrome: `grep "Rental Application" ~/.local/share/applications/*desktop`
5. Find the Exec command in the desktop file just found. For example, `grep Exec ~/.local/share/applications/chrome-onobjhkphejolhnnbkgckmkjhpoelkgh-Default.desktop`
6. Create `rentap` with the following code in it where the last line is the Exec command found in the previous step.

    ```bash
    #!/bin/sh
    if test ! -f /tmp/rentap-server-running
    then
      cd ~/github/rentap.js
      npm start > /tmp/rentap-server-running &
    fi
    /opt/google/chrome/google-chrome --profile-directory=Default --app-id=onobjhkphejolhnnbkgckmkjhpoelkgh
    ```
  If the page displays an error, then press F5 to refresh, and maybe ad a `sleep 4` or whatever length of time works after `npm start ...`

7. `chmod +x rentap`
8. `sudo mv rentap /usr/local/bin`
9. Create `rentap-stop` with the following code in it.

    ```bash
    #!/bin/sh
    npm stop
    rm /tmp/rentap-server-running
    ```

10. `chmod +x rentap-stop`
11. `sudo mv rentap-stop /usr/local/bin`
12. Edit the desktop file found previously and set `Exec=rentap`

Now you can launch *Rental Application* like any other on your linux desktop. 
To stop the www server (and delete the file indicating it's running), run `rentap-stop` in the terminal.
Since the file `/tmp/rentap-server-running` is in `/tmp` (which is in memory only), it will be deleted on reboot even if `rentap-stop` was never executed.

## Windows Powershell (ordinary user, no Adminstrator privilages needed)
### Install
1. `mkdir ~\nodejs`
2. `cd ~\nodejs`
3. `npm install rentap`

### (Optional) Import store.json From the Firefox (or Icecat) rentap extension
1. Find `store.json` in a hidden subdirectory of your home directory:`dir ~\AppData -recurse -ea 0 | % FullName | sls "store.json"`
2. Copy it to `~\nodejs\node_modules\rentap\import_storejson` Example: `cp ~\AppData\Roaming\Mozilla\Firefox\Profiles\4wvnz10q.default\jetpack\jid1-E1afJi6vbTfsRg@jetpack\simple-storage\store.json ~\nodejs\node_modules\rentap\import_storejson`
3. `cd ~\nodejs\node_modules\rentap\import_storejson`
4. `node import_storejson` and follow any prompts if it needs input from you
5. `mv store.db ..`

### Run
1. `cd ~\nodejs\node_modules\rentap`
2. `npm start`
3. Open any browser to http://localhost:3000 or http://127.0.0.1:3000

### (Optional) Google Appifying it and using a script to automatically run npm start
1. Run as above and open in Google Chrome
2. Click the 3-vertical-dot Google Chrome menu and choose More Tools -> Create Shortcut...
3. Checkmark "Open As Window" if you want it to look like a separate ap instead of a tab
4. Get the command that launches the ap:
    1. Windows Menu -> All apps -> Recently added -> Rental Application, right click it and choose More...-> Open file location
    2. In the window that pops up, find the Rental Application shortcut and right click it, choosing Properties
    3. The "Target" will already be highlighted, so press Ctrl+c to copy it.
5. Cancel the Properties window but keep the window showing the shortcut.
6. Create `~\rentap.ps1` with the following code in it where the last line is a modified version of the "Target" that was copied in step 4. That last line splits the "Target" into a FilePath and an ArgumentList. Looking at the example in this script should make it clear how to do it.

    ```ps1
    if (!(Test-Path "~\AppData\Local\Temp\rentap-server-running")) {
      Start-Job -FilePath "~\rentap-server.ps1"
      sleep 4
    }
    Start -FilePath "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" -ArgumentList "--profile-directory=Default --app-id=onobjhkphejolhnnbkgckmkjhpoelkgh"
    ```
  My Windows computer is slow, so I added a `sleep 4`. This line may not be necessary, or 4 may be too long or too short - experiment.

7. Create `~\rentap-server.ps1` with the following code in it:

    ```ps1
    cd ~\nodejs\node_modules\rentap
    npm start > "~\AppData\Local\Temp\rentap-server-running"
    ```

8. Create `~\rentap-stop.ps1` with the following code in it:

    ```ps1
    npm stop
    rm "~\AppData\Local\Temp\rentap-server-running"
    ```
9. Go back to the window showing the `Rental Application` shortcut, right click it, and choose Properties.
10. Delete the highlighted "Target" and insert the following:

    ```ps1
    C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\Users\Colin\rentap.ps1
    ```
  Of course, replace "Colin" with your username.

11. Turns out Windows doesn't delete the contents of `~\AppData\Local\Temp\` on reboot, so it's necessary to create a script to delete `rentap-server-running` and put it in the startup folder.
    1. Create `~\rentap-not-running.ps1` with just one line:

    ```ps1
    rm "~\AppData\Local\Temp\rentap-server-running"
    ```
    2. Open Windows startup folder: Right-click on the start menu, choose Run, and type `Shell:common startup`. This should bring up `"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"`.
    3. Open your home folder, Right-click on `rentap-not-running.ps1` and create a shortcut.
    4. Drag the shortcut to the Startup folder (and allow administrative privilages to do it).
    5. Right-click the shortcut just moved to the Startup folder and change the Target, inserting the following at the beginning: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File ` (and allow administrative privilages to do it).
    6. For example, my Target looks like this: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\Users\Colin\rentap-not-running.ps1`

Now you can launch *Rental Application* like any other. If on first launch, the page displays an error, press F5 to refresh the page because it tried to display the page before the server was up. You may need to play around with the line that says `sleep 4` in the example script above.
To stop the www server (and delete the file indicating it's running), run `~/rentap-stop.ps1` in PowerShell.

