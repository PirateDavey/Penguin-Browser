# 🐧 Penguin Browser

Penguin Browser is a Linux-inspired desktop web browser starter project built with [Electron](https://www.electronjs.org/). It uses Electron's Chromium engine to display real websites in tabs.

## Features

- Multiple tabs
- Address bar with web search
- Back, forward, reload, stop, and home controls
- Bookmarks and browsing history saved locally
- Downloads saved into your operating system's Downloads folder
- Dark and light appearance
- Keyboard shortcuts: `Ctrl/Cmd + L` (focus address bar), `Ctrl/Cmd + T` (new tab), `Ctrl/Cmd + W` (close tab), and `Ctrl/Cmd + R` (reload)
- Shared website session and cookies between tabs

## Requirements

Before launching Penguin Browser, install **Node.js LTS**, which includes npm:

1. Visit [https://nodejs.org/](https://nodejs.org/).
2. Download and install the LTS version for your operating system.
3. Close and reopen your terminal after installation.
4. Check that Node.js and npm are installed by running:

   ```bash
   node --version
   npm --version
   ```

You need an internet connection the first time you install the project dependencies.

## Launch Penguin Browser from a terminal

First, extract the downloaded ZIP file. Open a terminal **inside the extracted `penguin-browser` project folder**. This is the folder containing `package.json`.

### Windows — Command Prompt

1. Open the extracted `penguin-browser` folder in File Explorer.
2. Click the folder's address bar, type `cmd`, and press Enter. Command Prompt opens in that folder.
3. Run these commands:

   ```bat
   npm install
   npm start
   ```

### Windows — PowerShell

1. Open PowerShell.
2. Change to the project folder. Replace the example path with the location where you extracted the ZIP:

   ```powershell
   cd "$HOME\Downloads\penguin-browser"
   ```

3. Install the dependencies and launch the browser:

   ```powershell
   npm install
   npm start
   ```

### Windows — one-click terminal launcher

You can also double-click **`run.bat`** in the project folder. It checks for Node.js and npm, installs the dependencies on the first launch, and starts Penguin Browser. Alternatively, from a terminal in the project folder, run:

```bat
run.bat
```

If you prefer PowerShell, run:

```powershell
.\run.ps1
```

### Linux

1. Open a terminal.
2. Change to the extracted project folder. For example:

   ```bash
   cd ~/Downloads/penguin-browser
   ```

3. Make the launcher executable and run it:

   ```bash
   chmod +x run.sh
   ./run.sh
   ```

The launcher installs dependencies if they are not already present, then starts the browser. You can also run the commands manually:

```bash
npm install
npm start
```

### macOS

1. Open Terminal.
2. Change to the extracted project folder. For example:

   ```bash
   cd ~/Downloads/penguin-browser
   ```

3. Run the launcher:

   ```bash
   chmod +x run.sh
   ./run.sh
   ```

Or launch manually with `npm install` followed by `npm start`.

## Build an installable application

To package Penguin Browser for your operating system, open a terminal in the project folder and run:

```bash
npm install
npm run dist
```

The generated packages are placed in the `release/` folder. Build on the target operating system for the most reliable result:

- **Linux:** AppImage and `.deb`
- **Windows:** installer and portable application
- **macOS:** `.dmg`

## Upload the project to GitHub

1. Sign in to [GitHub](https://github.com/) and create a new repository.
2. Extract the Penguin Browser ZIP file on your computer.
3. Upload the contents of the `penguin-browser` folder to your repository. Make sure `README.md` is at the top level of the repository.
4. Do **not** upload `node_modules/` or `release/`. These folders are generated on your computer and are excluded by `.gitignore`.

Other people can then clone or download the repository, install Node.js, and follow the terminal launch instructions above.

## Troubleshooting

- **`node` or `npm` is not recognised / command not found:** Install Node.js LTS from [nodejs.org](https://nodejs.org/), then close and reopen the terminal.
- **Dependencies fail to install:** Check your internet connection, confirm you are in the folder containing `package.json`, and run `npm install` again.
- **The browser does not start:** Run `npm start` from the project folder and read the error message printed in the terminal.
- **Linux says permission denied for `run.sh`:** Run `chmod +x run.sh`, then try `./run.sh` again.

## Notes

- Penguin Browser is an independent project and is not affiliated with Mozilla Firefox, the Linux Foundation, or any Linux distribution.
- Website compatibility and security depend on the bundled Electron/Chromium version. Keep dependencies updated and review Electron's security guidance before distributing builds widely.
- Browsing data, such as bookmarks, history, and cookies, is stored locally on the user's machine.

## License

MIT. See [LICENSE](LICENSE).
