# Efexis

Efexis is a lightweight desktop utility for simulating supported Discord game activity without downloading full game installs. It is designed for users who want a cleaner way to handle Discord quest-style rewards, save storage space, and avoid installing large games just to satisfy short activity requirements.

The project also includes a polished promotional website in the `website` folder.

## What Efexis Does

- Creates tiny local game runner files instead of requiring full game downloads
- Helps Discord detect supported game activity for eligible quests
- Keeps the experience lightweight, fast, and simple
- Avoids installing massive game folders for short reward tasks
- Provides a modern desktop interface built with Tauri, Rust, and Vue

## Website

The website is a static frontend located in:

```text
website/
```

For Vercel deployment, use:

```text
Root Directory: website
Framework Preset: Other or Vite
Build Command: leave empty
Output Directory: .
```

## Windows Installation

Download the latest release when available, then extract Efexis into a folder where the app can create files.

Avoid restricted folders such as:

```text
C:\Program Files\
C:\
```

Efexis needs write permission because it creates small local runner files beside the app data. A normal folder such as Downloads, Documents, Desktop, or a custom folder is recommended.

## Requirement

Efexis uses Microsoft WebView2 through Tauri.

WebView2 is already included on most Windows 11 systems. If it is missing, install it from Microsoft:

[Download WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2)

## Supported Platform

Currently supported:

- Windows 11

Planned or under consideration:

- Windows 10 testing
- Linux support
- macOS support

## Tech Stack

- Rust
- Tauri
- Vue
- TypeScript
- Vite

## Development Setup

Install dependencies:

```bash
pnpm install
```

Build and copy the Windows runner:

```bash
pnpm build:runner:win
pnpm copy:runner:win
```

Start the desktop app in development mode:

```bash
pnpm tauri dev
```

## Disclaimer

Efexis is intended for educational and personal use. Use it responsibly and respect Discord's terms, game publisher rules, and any platform requirements.

This project is not affiliated with, endorsed by, or sponsored by Discord.

## License

[MIT License](LICENSE)
