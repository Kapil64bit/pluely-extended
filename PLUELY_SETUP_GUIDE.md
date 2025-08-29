# Pluely - AI-Powered Screenshot Analysis Tool

## 📋 Overview

Pluely is a powerful desktop application that combines screenshot capture with AI-powered analysis. It allows you to capture screenshots (both area selection and full screen) and automatically process them through various AI providers for intelligent analysis, coding assistance, and more.

## ✨ Features

- **Dual Screenshot Modes**: Area selection and full-screen capture
- **Multiple AI Providers**: OpenAI, Claude, Gemini, Grok, and more
- **Global Hotkeys**: System-wide keyboard shortcuts for quick access
- **Automatic Processing**: Instant AI analysis of captured screenshots
- **Tray Integration**: Minimizes to system tray for easy access
- **Cross-Platform**: Windows, macOS, and Linux support
- **Secure**: Local processing with API key management

## 🔧 System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Network**: Internet connection for AI API access

### Recommended Requirements
- **OS**: Windows 11 or macOS 12+
- **RAM**: 8GB or more
- **Storage**: 1GB free space
- **Display**: 1920x1080 or higher resolution

## 🚀 Installation Guide

### Option 1: Download Pre-built Release (Recommended)

1. **Visit the Releases Page**
   - Go to: `https://github.com/Kapil64bit/pluely-extended/releases`
   - Download the latest release for your operating system

2. **Windows Installation**
   ```
   - Download: `pluely-x.x.x-x64-setup.exe`
   - Run the installer
   - Follow the installation wizard
   - Launch Pluely from Start Menu or Desktop shortcut
   ```

3. **macOS Installation**
   ```
   - Download: `pluely-x.x.x-x64.dmg`
   - Open the DMG file
   - Drag Pluely to Applications folder
   - Launch from Applications or Spotlight
   ```

4. **Linux Installation**
   ```
   - Download: `pluely-x.x.x-x64.AppImage` (or .deb/.rpm)
   - Make executable: `chmod +x pluely-x.x.x-x64.AppImage`
   - Run: `./pluely-x.x.x-x64.AppImage`
   ```

### Option 2: Build from Source

#### Prerequisites
- **Node.js**: v18 or higher
- **Rust**: v1.70 or higher
- **Git**: Latest version

#### Windows Setup
```bash
# Install Node.js (if not already installed)
# Download from: https://nodejs.org/

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Clone the repository
git clone https://github.com/Kapil64bit/pluely-extended.git
cd pluely-extended

# Install dependencies
npm install

# Build and run
npm run tauri dev
```

#### macOS Setup
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Clone repository
git clone https://github.com/Kapil64bit/pluely-extended.git
cd pluely-extended

# Install dependencies
npm install

# Build and run
npm run tauri dev
```

#### Linux Setup
```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install system dependencies
sudo apt-get install -y libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf

# Clone repository
git clone https://github.com/Kapil64bit/pluely-extended.git
cd pluely-extended

# Install dependencies
npm install

# Build and run
npm run tauri dev
```

## ⚙️ Configuration

### API Key Setup

1. **Launch Pluely**
   - Open the application
   - Click on "Settings" in the sidebar

2. **Configure AI Providers**
   - **OpenAI**: Enter your OpenAI API key
   - **Claude**: Enter your Anthropic API key
   - **Gemini**: Enter your Google AI API key
   - **Grok**: Enter your xAI API key

3. **Test Connection**
   - Click "Test" next to each provider
   - Ensure all connections are successful

### Hotkey Configuration

Pluely comes with pre-configured global hotkeys, but you can customize them:

1. **Access Hotkey Settings**
   - Go to Settings → Hotkeys
   - View current hotkey assignments

2. **Default Hotkeys** (Windows/Linux):
   - `Ctrl + Alt + S`: Area screenshot
   - `Ctrl + Alt + X`: Full screenshot
   - `Ctrl + Alt + P`: Launch/Focus app
   - `Ctrl + Alt + Shift + P`: Restart app
   - `Ctrl + Alt + Q`: Quit app
   - `Ctrl + Alt + V`: Toggle voice
   - `Ctrl + Alt + C`: Clipboard analysis
   - `Ctrl + Alt + H`: Toggle history
   - `Ctrl + Alt + M`: Cycle AI model

3. **macOS Hotkeys**:
   - `Cmd + Option + S`: Area screenshot
   - `Cmd + Option + X`: Full screenshot
   - `Cmd + Option + P`: Launch/Focus app
   - `Cmd + Option + Shift + P`: Restart app
   - `Cmd + Option + Q`: Quit app
   - `Cmd + Option + V`: Toggle voice
   - `Cmd + Option + C`: Clipboard analysis
   - `Cmd + Option + H`: Toggle history
   - `Cmd + Option + M`: Cycle AI model

## 🎯 Usage Guide

### Basic Screenshot Capture

#### Area Screenshot (Ctrl + Alt + S)
1. **Press the hotkey**: `Ctrl + Alt + S` (or `Cmd + Option + S` on Mac)
2. **Select area**: Click and drag to select the region you want to capture
3. **Release**: Let go of the mouse button to capture
4. **Wait for processing**: The screenshot will be automatically analyzed by AI

#### Full Screenshot (Ctrl + Alt + X)
1. **Press the hotkey**: `Ctrl + Alt + X` (or `Cmd + Option + X` on Mac)
2. **Instant capture**: The entire screen is captured automatically
3. **Wait for processing**: The screenshot will be automatically analyzed by AI

### Advanced Features

#### AI Model Selection
- **Cycle through models**: Press `Ctrl + Alt + M`
- **Available models**:
  - GPT-4 (OpenAI)
  - Claude-3 (Anthropic)
  - Gemini Pro (Google)
  - Grok (xAI)

#### Voice Integration
- **Toggle voice**: Press `Ctrl + Alt + V`
- **Voice commands**: Speak naturally to interact with the AI
- **Voice responses**: Get audio feedback from the AI

#### Clipboard Analysis
- **Quick analysis**: Press `Ctrl + Alt + C`
- **Automatic processing**: Any text in your clipboard is analyzed
- **Smart detection**: Works with code, documents, and web content

#### Conversation History
- **Toggle history**: Press `Ctrl + Alt + H`
- **View past conversations**: Access previous AI interactions
- **Search history**: Find specific conversations or analyses

### Interface Overview

#### Main Window
- **Screenshot Panel**: View captured images and AI analysis
- **Chat Interface**: Interact with AI about screenshots
- **Settings Panel**: Configure API keys and preferences
- **History Panel**: Browse past conversations and analyses

#### System Tray
- **Minimize to tray**: Click the minimize button
- **Quick access**: Right-click tray icon for menu
- **Tray menu options**:
  - Show/Hide Window
  - Capture Screenshot
  - Analyze Clipboard
  - Cycle Model
  - Restart/Quit

## 🔍 Troubleshooting

### Common Issues

#### 1. Hotkeys Not Working
**Problem**: Global hotkeys aren't being recognized
**Solutions**:
- Check if other applications are using the same hotkeys
- Restart Pluely
- On Windows: Check Windows Game Bar settings
- On macOS: Check Accessibility permissions

#### 2. Screenshot Capture Fails
**Problem**: Screenshots aren't being captured
**Solutions**:
- Ensure you have proper permissions
- Check if screen recording is allowed
- Restart the application
- Verify display settings

#### 3. AI API Connection Issues
**Problem**: "Connection failed" or API errors
**Solutions**:
- Verify API keys are correct
- Check internet connection
- Ensure API quotas aren't exceeded
- Try different AI provider

#### 4. Application Won't Start
**Problem**: Pluely fails to launch
**Solutions**:
- Check system requirements
- Update graphics drivers
- Run as administrator (Windows)
- Check console logs for errors

### Performance Optimization

#### For Better Performance:
1. **Close unnecessary applications**
2. **Ensure stable internet connection**
3. **Use SSD storage**
4. **Keep system updated**
5. **Monitor RAM usage**

#### For Better Screenshot Quality:
1. **Use higher resolution displays**
2. **Ensure proper display scaling**
3. **Close overlay applications**
4. **Use latest graphics drivers**

## 🔐 Security & Privacy

### Data Handling
- **Local Processing**: Screenshots are processed locally
- **API Keys**: Stored securely in application settings
- **No Data Collection**: No usage data is collected
- **Secure Transmission**: All API calls use HTTPS

### Best Practices
1. **Use strong API keys**
2. **Regularly update API keys**
3. **Monitor API usage**
4. **Keep application updated**
5. **Use firewall protection**

## 📚 Advanced Usage

### Custom Hotkeys
You can modify hotkeys by editing the configuration file:
- Windows: `%APPDATA%\pluely\config.json`
- macOS: `~/Library/Application Support/pluely/config.json`
- Linux: `~/.config/pluely/config.json`

### Command Line Options
```bash
# Development mode
npm run tauri dev

# Build for production
npm run tauri build

# Build installer
npm run tauri build -- --no-bundle

# Run with custom config
pluely --config /path/to/config.json
```

### API Integration
Pluely can be integrated with other tools via its API:
```javascript
// Example integration
const { invoke } = window.__TAURI__.invoke;

async function captureAndAnalyze() {
  const result = await invoke('invoke_fullscreen_screenshot');
  console.log('Screenshot captured:', result);
}
```

## 🆘 Support & Help

### Getting Help
1. **Documentation**: Check this guide first
2. **GitHub Issues**: Report bugs at https://github.com/Kapil64bit/pluely-extended/issues
3. **Community**: Join discussions on GitHub
4. **Logs**: Check application logs for error details

### Log Locations
- **Windows**: `%APPDATA%\pluely\logs\`
- **macOS**: `~/Library/Logs/pluely/`
- **Linux**: `~/.local/share/pluely/logs/`

### Debug Mode
To enable debug logging:
1. Open Settings → Advanced
2. Enable "Debug Mode"
3. Restart application
4. Check logs for detailed information

## 📝 Changelog

### Version 0.1.1
- ✅ Added fullscreen screenshot support
- ✅ Improved hotkey management
- ✅ Enhanced AI provider integration
- ✅ Better error handling
- ✅ Performance optimizations

### Version 0.1.0
- ✅ Initial release
- ✅ Area screenshot capture
- ✅ Basic AI integration
- ✅ System tray support
- ✅ Global hotkeys

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Fork the repository
# Clone your fork
git clone https://github.com/yourusername/pluely-extended.git

# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run tauri dev

# Submit pull request
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri**: For the amazing desktop framework
- **AI Providers**: OpenAI, Anthropic, Google, xAI for their APIs
- **Community**: For feedback and contributions

---

**Happy Screenshot Analyzing!** 📸✨

For the latest updates, star the repository and follow [@Kapil64bit](https://github.com/Kapil64bit) on GitHub.
