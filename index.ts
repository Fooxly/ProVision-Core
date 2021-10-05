import * as path from 'path';
import * as vscode from 'vscode';

import { getResultsForGroup, navigateToHitResult } from './DocumentHelper';
import updater from './updater';

export let coreConfig: vscode.WorkspaceConfiguration;

const disposables: vscode.Disposable[] = [];
let extensionContext: vscode.ExtensionContext | undefined = undefined;
// Initializes the ProVision Core
export const initialize = (context: vscode.ExtensionContext) => {
    extensionContext = context;
	// Setup all the configruation settings
    handleConfigUpdate();
    // Update ProVision if needed
    if (updater.updateSettings()) {
        handleConfigUpdate();
    }
    // Configuration change listener
    vscode.workspace.onDidChangeConfiguration(() => {
        handleConfigUpdate();
	});

    // Rregister all the commands
    vscode.commands.getCommands().then(commands => {
        if (!commands.includes('ProVision.listGroup'))
            disposables.push(vscode.commands.registerCommand('ProVision.listGroup', handleListGroup));
        if (!commands.includes('ProVision.help'))
            disposables.push(vscode.commands.registerCommand('ProVision.help', handleHelp));
    });
};

// Destroys everything the core has created
export const destroy = () => {
    for (const disposable of disposables) {
        disposable.dispose();
    }
};

const handleConfigUpdate = () => {
    coreConfig = vscode.workspace.getConfiguration('ProVision');
};

// Handle the listing of groups
const handleListGroup = (...args: any[]) => {
    const group = args[0];
    const range: vscode.Range | undefined = args[1];
    // Get the items which should be listed
    const hits = getResultsForGroup(group, vscode.window.activeTextEditor?.document as vscode.TextDocument, range);
    // If there are no hits, show an information message
    if (hits.length === 0) {
        vscode.window.showInformationMessage('No notes found. Good job!');
        return;
    }

    // Move when single result is given and list.moveOnSingleResult is true
    if (hits.length === 1 && (coreConfig.get<boolean>('list.moveOnSingleResult') ?? true)) {
        navigateToHitResult(hits[0]);
        return;
    }

    const listItems: vscode.QuickPickItem[] = [];
    for (const hit of hits) {
        listItems.push({
            label: `${hit.keyword} (Line: ${hit.lineNumber})`,
            description: hit.note
        });
    }
    // Show the quick picker
    vscode.window.showQuickPick(listItems, {
        canPickMany: false,
        placeHolder: 'Select a note'
    }).then(option => {
        if (!option) return;
        // Get the correct hit which was chosen from the list and navigate towards it
        const chosenHit = hits[listItems.indexOf(option)];
        if (!chosenHit) {
            vscode.window.showErrorMessage('Could not find hit result, please try again');
            return;
        }
        navigateToHitResult(chosenHit);
    });
};

// Show the help readme for users which need more help
const handleHelp = () => {
    if (!extensionContext) return;
    vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(path.join(extensionContext.extensionPath, "MANUAL.md")));
};

export default {
    initialize,
    destroy
};
