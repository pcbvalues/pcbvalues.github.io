# Setting up your local environment for PCBValues development

## Installing git
Git is required to properly sync and submit changes to the PCBValues repository.

### Windows:
- Download the latest git version for windows from [the official site](https://git-scm.com/downloads/win)
  - Alternatively install it using winget: `winget install --id Git.Git -e --source winget`
- Run the setup executable and take note of the folder where it will be installed to.
- Navigate to the folder where Git is installed (Usually `C:\Program Files\Git`) and find the `bin` folder, copy the full path of this folder and add it to your user's `PATH` environment variable, as explained [here](https://www.eukhost.com/kb/how-to-add-to-the-path-on-windows-10-and-windows-11/).
- Open a new Windows terminal/command prompt/powershell window and type `git -v`, if you get the response of `git version <version number>` you're ready, if it shows a command not found error, redo the previous steps.

### MacOS:
- Easiest way to install development tools in MacOS is installing [Homebrew](https://brew.sh/).
- Once homebrew has been installed run `brew install git` in a terminal to install git.
- Run `git -v` to make sure git is correctly installed and setup.

### Linux:
- You most likely already have it installed if you use Linux, but if you don't, simply follow your distro's procedure for installing it. (eg: `sudo apt install git` on debian/ubuntu based distros, `sudo dnf install git` on fedora/RHEL based distros, etc).

## Installing GitHub CLI

Easiest way to login to GitHub is using the GitHub CLI.

### Windows:
- Download the latest MSI installer file from [the releases page](https://github.com/cli/cli/releases/latest), pick "Windows 386 installer" for 32 bit Windows and "Windows amd64 installer", regardless of whether you have an Intel or AMD CPU.
  - Alternatively install it from Winget: `winget install --id GitHub.cli`
- Execute the downloaded file and make sure it was added to path by running `gh version` in a new terminal/command prompt/powershell window.

### MacOS:
- Similar to git simply run `brew install gh`.

### Linux:
- Follow the procedure in their official repo related to your specific distro [link](https://github.com/cli/cli/blob/trunk/docs/install_linux.md).


## Logging in to GitHub

You need to make git aware of your GitHub credentials to allow it to commit changes to the repository.

- Open a new terminal window (or command prompt/powershell on Windows).
- Run `gh auth login`.
- A new browser window will be open where it asks you to grant the GitHub CLI access to your account, agree to it.
- Run `gh auth status` and verify that you're logged in to your account.


## Installing Node.js and pnpm

PCBValues' build system is built on Node.js and therefore it is required to properly render changes to the source code.

- Download the latest version from the [official website](https://nodejs.org/en/download/current) with the following options:
  - The version that's marked as `Current` (aka latest stable).
  - The OS you are running.
  - nvm.
  - pnpm (default is npm).

- Alternatively download node from your package manager of choice: [link](https://nodejs.org/en/download/package-manager/all) and install pnpm according to their instructions: [link](https://pnpm.io/installation)

- To verify both were installed properly run: `node -v` and `pnpm -v` in a new terminal window (or command prompt/powershell on Windows).

## Installing VS Code

The recommended development environment for PCBValues is Visual Studio Code, you can skip this process if you already have a Text editor/IDE with adequate TypeScript support setup.

- Download the latest version from the website for your platform: [link](https://code.visualstudio.com/download).
  - Alternatively download the fully open source fork, VSCodium if you desire more privacy: [link](https://vscodium.com/#install).

- Run the executable and make sure VS Code is now available in your applications list.
