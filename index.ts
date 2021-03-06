import * as path from 'path';
import * as vscode from 'vscode';

import { getCountForGroup, getResults, getResultsForGroup, navigateToHitResult } from './DocumentHelper';
import { HitResult } from './types';
import updater from './updater';
import { getGroups } from './utils';

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
        if (!commands.includes('ProVision.listAll'))
            disposables.push(vscode.commands.registerCommand('ProVision.listAll', handleListAll));
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
    let groupToGet = args[0];
    const range: vscode.Range | undefined = args[1];
    if (!groupToGet) {
        const listItems: vscode.QuickPickItem[] = [];
        const groups = getGroups();
        for (const group of groups) {
            const count = getCountForGroup(group, vscode.window.activeTextEditor?.document as vscode.TextDocument, range);
            listItems.push({
                label: `${group.charAt(0).toUpperCase()}${group.slice(1).toLowerCase()} (${count} ${count === 1 ? 'result' : 'results'})`
            });
        }
        // Show the quick picker
        vscode.window.showQuickPick(listItems, {
            canPickMany: false,
            placeHolder: 'Select a group'
        }).then(option => {
            if (!option) return;
            // Get the correct hit which was chosen from the list and navigate towards it
            const chosenGroup = groups[listItems.indexOf(option)];
            if (!chosenGroup) {
                vscode.window.showErrorMessage('Could not find hit result, please try again');
                return;
            }
            // Get the items which should be listed
            const hits = getResultsForGroup(chosenGroup, vscode.window.activeTextEditor?.document as vscode.TextDocument, range);
            handleListShow(hits);
        });
    } else {
        // Get the items which should be listed
        const hits = getResultsForGroup(groupToGet, vscode.window.activeTextEditor?.document as vscode.TextDocument, range);
        handleListShow(hits);
    }
};

const handleListAll = (...args: any[]) => {
    const range: vscode.Range | undefined = args[0];
    // Get the items which should be listed
    const hits = getResults(vscode.window.activeTextEditor?.document as vscode.TextDocument, range);
    handleListShow(hits);
};

const handleListShow = (hits: HitResult[]) => {
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
