# Applying changes to PCBValues

## Environment setup
Make sure your environment is setup correctly by following the steps in [this page](ENVIORMENT_SETUP.md).

## Cloning the repository

- Open a new terminal window (or command prompt/powershell) and navigate to the folder where you wish to have the local copy of the code (`cd <location>`).
- Clone the latest version of the code by running `git clone https://github.com/pcbvalues/pcbvalues.github.io.git`.
  - If you already have a local outdated copy you can update it by running `git pull` inside that folder, if it has unsaved changes you will need to run `git reset --hard` before.

## Opening the repository

Open VS Code (or your text editor of choice) and select the option to open a folder and open the folder where the code has been cloned to.

## Installing dependencies

- Open a terminal window inside the folder (VS Code's internal terminal is good for this task) and run `pnpm install`.

## Rendering changes

Once any of the source files in PCBValues or the scores database have been changed the changes must be rendered by running `pnpm release`.

## Updating version

Every time the scores or a meaningful part of the code gets changed, you should bump PCBvalues' version number accordingly, you do so by editing the `package.json` file in the root of the cloned folder.
- Open the `package.json` folder in VS Code (or your editor of choice).
- Bump the last number by 1 (this includes changes of orders of magnitude, eg. do 3.4.9->3.4.10, not 3.4.9->3.5.0) as changes in the other numbers are reserved for more substantial changes to the codebase.
- Save the file.

## Adding new scores

- Open a terminal window in the folder (VS Code's internal terminal is good).
- Run `pnpm score-server` and type `y` when it asks if you wish to open a browser window.
- Paste the json code from the block in the webhook message in the text box that says `JSON Input`.
- Click `Submit score` and wait for the response.
- Once all scores have been submitted, close the browser tab and press `ctrl`+`c` or close the terminal window to close the server (Ignore any errors after this action). 

## Submitting changes to GitHub

- Make sure the version in the `package.json` is the correct one for the next release.
- Open a terminal window in the folder (VS Code's internal terminal is good).
- Run `pnpm release` and make sure it finished without errors.
- Run `pnpm test` and make sure all tests passed.
- Run `git add -A` to add all changed files to git.
- Run `git commit -m "V<version number> - <what was changed>"` to properly notify other contributors and bystanders of the changes that took place.
- Run `git push` to send the changes off to github.