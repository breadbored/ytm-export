# Firefox YouTube Music Export

## Instructions for building the extension

1. **Install Dependencies**: Make sure you have Node.js and npm installed. Then, run:
   ```bash
   npm install
   ```
2. **Build the Extension**: Use the following command to build the extension:
   ```bash
   npm run build
   ```
3. **Load the Extension in Firefox**:
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
   - Click on "Load Temporary Add-on".
   - Select the `manifest.json` file from the `extension/ytm-export/dist` directory.

## Instructions for using the extension from Releases

1. **Download the Extension**: Go to the [Releases page](https://github.com/breadbored/ytm-export/releases) and download the latest `.xpi` file.
2. **Install the Extension**:
   - Open Firefox and navigate to `about:addons`.
   - Click on the gear icon and select "Install Add-on From File".
   - Choose the downloaded `.xpi` file.