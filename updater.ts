import * as vscode from 'vscode';

import { coreConfig } from '.';

const updateSettings = (): boolean => {
    if (coreConfig.has('keywords')) return false;

    const oldConfig = vscode.workspace.getConfiguration('provision');
    if (!oldConfig.has('keywords')) return false;
    const keywords = JSON.parse(JSON.stringify(oldConfig.get<any>('keywords')));
    let newGroups: any = {};
    const oldGroups = JSON.parse(JSON.stringify(oldConfig.get<any[]>('groups')));
    if (oldGroups) {
        for (const oldGroup of oldGroups) {
            for (const groupKeyword of oldGroup.keywords) {
                keywords[groupKeyword].group = oldGroup.keywords[0].toLowerCase();
            }
            
            newGroups[oldGroup.keywords[0].toLowerCase()] = {
                title: oldGroup.title,
                tooltip: oldGroup.tooltip,
            };
        }
    }

    // Set the new properties
    vscode.workspace.getConfiguration().update('ProVision.keywords', keywords, vscode.ConfigurationTarget.Global);
    vscode.workspace.getConfiguration().update('ProVision.groups', newGroups, vscode.ConfigurationTarget.Global);
    vscode.workspace.getConfiguration().update('ProVision.list.moveOnSingleResult', oldConfig.get('moveOnSingle'), vscode.ConfigurationTarget.Global);
    vscode.workspace.getConfiguration().update('ProVision.bar.side', oldConfig.get('bar.position'), vscode.ConfigurationTarget.Global);
    vscode.workspace.getConfiguration().update('ProVision.bar.priority', oldConfig.get('bar.priority'), vscode.ConfigurationTarget.Global);

    vscode.window.showInformationMessage("Hello there, we have just updated ProVision for you. However, there are some setting changes, so if something feels wrong, please check your settings.json or look at our manual via Help: ProVision");
    return true;
};

export default {
    updateSettings
};
